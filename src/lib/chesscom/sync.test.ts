import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db/schema';
import { ChessComClient } from './client';
import { connectAccount, disconnectAccount, syncAccount, syncStore } from './sync';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function game(month: number, id: string, userWhite = true) {
  return {
    url: `https://www.chess.com/game/live/${id}`,
    pgn: '[ECO "C50"]\n\n1. e4 e5 *',
    time_control: '600',
    end_time: Date.UTC(2026, month - 1, 10) / 1000,
    rated: true,
    uuid: id,
    time_class: 'rapid',
    rules: 'chess',
    white: { rating: 1500, result: userWhite ? 'win' : 'resigned', '@id': '', username: userWhite ? 'Tester' : 'opp' },
    black: { rating: 1490, result: userWhite ? 'resigned' : 'win', '@id': '', username: userWhite ? 'opp' : 'Tester' },
  };
}

function makeClient() {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (url: string) => {
    const path = url.replace('https://api.chess.com/pub', '');
    calls.push(path);
    if (path === '/player/tester') return json({ username: 'Tester', player_id: 1, '@id': '', url: '', status: 'basic', country: 'https://api.chess.com/pub/country/BR', joined: 1, last_online: 2, followers: 0 });
    if (path === '/player/tester/stats') return json({ chess_rapid: { last: { rating: 1510, date: 1 }, best: { rating: 1600, date: 1 }, record: { win: 10, loss: 5, draw: 1 } } });
    if (path === '/player/tester/games/archives') return json({ archives: ['2026/09', '2026/10', '2026/11'].map((m) => `https://api.chess.com/pub/player/tester/games/${m}`) });
    if (path === '/player/tester/games/2026/09') return json({ games: [game(9, 'a'), game(9, 'b', false)] });
    if (path === '/player/tester/games/2026/10') return json({ games: [game(10, 'c')] });
    if (path === '/player/tester/games/2026/11') return json({ games: [game(11, 'd')] });
    if (path === '/player/ghost') return json({}, 404);
    return json({}, 404);
  });
  return { client: new ChessComClient({ fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async () => undefined }), calls };
}

async function waitSync() {
  for (let i = 0; i < 200 && syncStore.get().running; i++) await new Promise((r) => setTimeout(r, 5));
}

describe('sincronização Chess.com', () => {
  beforeEach(async () => {
    await disconnectAccount(false);
    syncStore.set({ running: false, error: null });
  });

  it('rejeita usuário inexistente sem gravar nada', async () => {
    const { client } = makeClient();
    await expect(connectAccount('ghost', '12m', client)).rejects.toMatchObject({ kind: 'not_found' });
    expect(await db.account.count()).toBe(0);
  });

  it('importa perfil, estatísticas e partidas em série e reaproveita meses fechados', async () => {
    const { client, calls } = makeClient();
    await connectAccount('Tester', 'all', client);
    await waitSync();
    const acc = await db.account.get('chesscom');
    expect(acc?.displayUsername).toBe('Tester');
    expect(acc?.stats?.chess_rapid?.last?.rating).toBe(1510);
    expect(acc?.lastGamesSyncAt).toBeTypeOf('number');
    expect(await db.games.count()).toBe(4);
    const b = await db.games.get('b');
    expect(b?.userColor).toBe('black');
    expect(b?.result).toBe('win');
    expect(syncStore.get().newGames).toBe(4);

    // Segunda sincronização: meses já encerrados (setembro/outubro de 2026 em relação a "agora") não são buscados de novo.
    calls.length = 0;
    await syncAccount({ client });
    const monthCalls = calls.filter((c) => /games\/\d{4}\/\d{2}$/.test(c));
    const archives = await db.archives.toArray();
    const closed = archives.filter((a) => a.complete).map((a) => `/player/tester/games/${a.year}/${String(a.month).padStart(2, '0')}`);
    for (const c of closed) expect(monthCalls).not.toContain(c);
    expect(await db.games.count()).toBe(4);
  });

  it('desconectar remove apenas os dados importados', async () => {
    const { client } = makeClient();
    await db.notes.put({ id: 'n1', title: 'minha nota', body: '', category: 'Geral', collectionIds: [], tags: [], fen: null, gameRef: null, favorite: false, isMistake: false, createdAt: 0, updatedAt: 0 });
    await connectAccount('Tester', '3m', client);
    await waitSync();
    await disconnectAccount(false);
    expect(await db.account.count()).toBe(0);
    expect(await db.games.count()).toBe(0);
    expect(await db.notes.get('n1')).toBeTruthy();
  });
});
