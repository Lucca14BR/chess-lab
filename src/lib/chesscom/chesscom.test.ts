import { describe, expect, it, vi } from 'vitest';
import { ChessComClient, ChessComError, validateUsername, parseArchiveUrl } from './client';
import { normalizeGame, openingFamily, openingNameFromUrl, sideResult, formatTimeControl } from './normalize';
import { archivesInScope, monthEndUtc } from './sync';
import type { ChessComGame } from './types';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });

describe('validateUsername', () => {
  it('aceita nomes válidos e rejeita e-mail e caracteres inválidos', () => {
    expect(validateUsername('magnus_carlsen')).toBeNull();
    expect(validateUsername('a-b')).toBeNull();
    expect(validateUsername('')).not.toBeNull();
    expect(validateUsername('eu@email.com')).toMatch(/e-mail/);
    expect(validateUsername('ab')).not.toBeNull();
    expect(validateUsername('nome com espaço')).not.toBeNull();
  });
});

describe('ChessComClient', () => {
  it('repete após 429 respeitando Retry-After e sinaliza o limite', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json({}, 429, { 'Retry-After': '3' })).mockResolvedValueOnce(json({ username: 'x' }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const c = new ChessComClient({ fetchImpl: fetchImpl as unknown as typeof fetch, sleep });
    const onRate = vi.fn();
    c.onRateLimit = onRate;
    const p = await c.profile('X');
    expect(p).toEqual({ username: 'x' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(3000, undefined);
    expect(onRate).toHaveBeenCalledWith(3000);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.chess.com/pub/player/x');
  });

  it('desiste após o limite de tentativas com erro rate_limited', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json({}, 429));
    const c = new ChessComClient({ fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async () => undefined, maxRetries: 2 });
    await expect(c.stats('x')).rejects.toMatchObject({ kind: 'rate_limited' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('mapeia 404 e falha de rede', async () => {
    const c404 = new ChessComClient({ fetchImpl: (async () => json({}, 404)) as unknown as typeof fetch });
    await expect(c404.profile('nao-existe')).rejects.toMatchObject({ kind: 'not_found' });
    const cNet = new ChessComClient({ fetchImpl: (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch });
    await expect(cNet.profile('x')).rejects.toBeInstanceOf(ChessComError);
    await expect(cNet.profile('x')).rejects.toMatchObject({ kind: 'network' });
  });

  it('executa requisições em série, nunca em paralelo', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchImpl = vi.fn().mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return json({ archives: [] });
    });
    const c = new ChessComClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await Promise.all([c.archives('a'), c.archives('b'), c.archives('c')]);
    expect(maxInFlight).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});

describe('normalização de partidas', () => {
  const game: ChessComGame = {
    url: 'https://www.chess.com/game/live/1',
    pgn: '[ECO "B07"]\n[ECOUrl "https://www.chess.com/openings/Pirc-Defense-Main-Line...5.Qd2-c6"]\n\n1. e4 g6 *',
    time_control: '180+2',
    end_time: 1709318713,
    rated: true,
    uuid: 'u1',
    time_class: 'blitz',
    rules: 'chess',
    white: { rating: 1590, result: 'timeout', '@id': '', username: 'Rival' },
    black: { rating: 1600, result: 'win', '@id': '', username: 'Eu' },
    eco: 'https://www.chess.com/openings/Pirc-Defense-Main-Line...5.Qd2-c6',
  };

  it('identifica cor, resultado e ratings do ponto de vista do usuário', () => {
    const g = normalizeGame(game, 'eu')!;
    expect(g.userColor).toBe('black');
    expect(g.result).toBe('win');
    expect(g.resultDetail).toBe('timeout');
    expect(g.userRating).toBe(1600);
    expect(g.opponentRating).toBe(1590);
    expect(g.opponent).toBe('Rival');
    expect(g.eco).toBe('B07');
    expect(g.openingName).toBe('Pirc Defense Main Line');
    expect(g.openingFamily).toBe('Pirc Defense');
    expect(g.endTime).toBe(1709318713000);
  });

  it('ignora partidas que não são do usuário ou de modalidade desconhecida', () => {
    expect(normalizeGame(game, 'outro')).toBeNull();
    expect(normalizeGame({ ...game, time_class: 'bughouse' }, 'eu')).toBeNull();
  });

  it('classifica códigos de resultado', () => {
    expect(sideResult('win')).toBe('win');
    expect(sideResult('repetition')).toBe('draw');
    expect(sideResult('stalemate')).toBe('draw');
    expect(sideResult('resigned')).toBe('loss');
    expect(sideResult('checkmated')).toBe('loss');
  });

  it('extrai nomes e famílias de abertura', () => {
    expect(openingNameFromUrl('https://www.chess.com/openings/Sicilian-Defense-Najdorf-Variation-6.Bg5')).toBe('Sicilian Defense Najdorf Variation');
    expect(openingFamily('Sicilian Defense Najdorf Variation')).toBe('Sicilian Defense');
    expect(openingFamily('Queens Gambit Declined')).toBe('Queens Gambit');
    expect(openingNameFromUrl(null)).toBeNull();
  });

  it('formata ritmo', () => {
    expect(formatTimeControl('180+2')).toBe('3 min + 2 s');
    expect(formatTimeControl('600')).toBe('10 min');
    expect(formatTimeControl('1/86400')).toBe('1 dia por lance');
  });
});

describe('arquivos e escopo', () => {
  it('lê ano/mês da URL do arquivo', () => {
    expect(parseArchiveUrl('https://api.chess.com/pub/player/x/games/2024/03')).toEqual({ year: 2024, month: 3 });
  });
  it('filtra meses pelo escopo de importação', () => {
    const urls = ['2023/01', '2025/12', '2026/09', '2026/10', '2026/11'].map((m) => `https://api.chess.com/pub/player/x/games/${m}`);
    const now = new Date(Date.UTC(2026, 10, 15));
    expect(archivesInScope(urls, '3m', now).map((u) => u.slice(-7))).toEqual(['2026/09', '2026/10', '2026/11']);
    expect(archivesInScope(urls, '12m', now)).toHaveLength(4);
    expect(archivesInScope(urls, 'all', now)).toHaveLength(5);
  });
  it('calcula o fim do mês em UTC', () => {
    expect(monthEndUtc(2024, 12)).toBe(Date.UTC(2025, 0, 1));
  });
});
