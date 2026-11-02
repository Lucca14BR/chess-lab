// Cliente da PubAPI do Chess.com.
// - Somente endpoints públicos e documentados, somente leitura.
// - Requisições em série (uma por vez), como recomenda a documentação.
// - Tratamento de 429 (limite de requisições) com espera e novas tentativas.
// - Revalidação HTTP (ETag/Last-Modified) via `cache: 'no-cache'`.
import type { ChessComArchives, ChessComMonthGames, ChessComProfile, ChessComStats } from './types';

export const API_BASE = 'https://api.chess.com/pub';

export type ChessComErrorKind = 'not_found' | 'rate_limited' | 'network' | 'server' | 'invalid' | 'aborted';

export class ChessComError extends Error {
  kind: ChessComErrorKind;
  status: number | null;
  constructor(kind: ChessComErrorKind, message: string, status: number | null = null) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

export const USERNAME_RE = /^[A-Za-z0-9_-]{3,25}$/;

export function validateUsername(raw: string): string | null {
  const u = raw.trim();
  if (!u) return 'Informe seu nome de usuário do Chess.com.';
  if (u.includes('@')) return 'Use o nome de usuário, não o e-mail.';
  if (!USERNAME_RE.test(u)) return 'Nomes de usuário têm de 3 a 25 caracteres: letras, números, "_" ou "-".';
  return null;
}

type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>;

const defaultSleep: Sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new ChessComError('aborted', 'Operação cancelada.'));
    });
  });

export interface ClientOptions {
  fetchImpl?: typeof fetch;
  sleep?: Sleep;
  maxRetries?: number;
  baseDelayMs?: number;
}

export class ChessComClient {
  private queue: Promise<unknown> = Promise.resolve();
  private fetchImpl: typeof fetch;
  private sleep: Sleep;
  private maxRetries: number;
  private baseDelayMs: number;
  onRateLimit?: (waitMs: number) => void;

  constructor(opts: ClientOptions = {}) {
    this.fetchImpl = opts.fetchImpl ?? ((...args) => fetch(...args));
    this.sleep = opts.sleep ?? defaultSleep;
    this.maxRetries = opts.maxRetries ?? 4;
    this.baseDelayMs = opts.baseDelayMs ?? 2000;
  }

  /** Enfileira a requisição: nunca há duas em paralelo. */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private request<T>(path: string, signal?: AbortSignal, as: 'json' | 'text' = 'json'): Promise<T> {
    return this.enqueue(async () => {
      for (let attempt = 0; ; attempt++) {
        if (signal?.aborted) throw new ChessComError('aborted', 'Operação cancelada.');
        let res: Response;
        try {
          res = await this.fetchImpl(`${API_BASE}${path}`, {
            signal,
            cache: 'no-cache',
            headers: { Accept: as === 'json' ? 'application/json' : 'application/x-chess-pgn' },
          });
        } catch (e) {
          if ((e as Error)?.name === 'AbortError' || signal?.aborted) throw new ChessComError('aborted', 'Operação cancelada.');
          throw new ChessComError('network', 'Não foi possível acessar a API do Chess.com. Verifique sua conexão.');
        }
        if (res.status === 429 || res.status >= 500) {
          if (attempt >= this.maxRetries) {
            throw res.status === 429
              ? new ChessComError('rate_limited', 'O Chess.com limitou as requisições (429). Tente novamente em alguns minutos.', 429)
              : new ChessComError('server', `A API do Chess.com respondeu com erro ${res.status}.`, res.status);
          }
          const retryAfter = Number(res.headers.get('Retry-After'));
          const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : this.baseDelayMs * 2 ** attempt;
          if (res.status === 429) this.onRateLimit?.(wait);
          await this.sleep(wait, signal);
          continue;
        }
        if (res.status === 404) throw new ChessComError('not_found', 'Recurso não encontrado no Chess.com.', 404);
        if (res.status === 410) throw new ChessComError('not_found', 'Este recurso não está mais disponível no Chess.com.', 410);
        if (!res.ok) throw new ChessComError('server', `A API do Chess.com respondeu com erro ${res.status}.`, res.status);
        try {
          return (as === 'json' ? await res.json() : await res.text()) as T;
        } catch {
          throw new ChessComError('invalid', 'Resposta inválida da API do Chess.com.');
        }
      }
    });
  }

  profile(username: string, signal?: AbortSignal) {
    return this.request<ChessComProfile>(`/player/${encodeURIComponent(username.toLowerCase())}`, signal);
  }

  stats(username: string, signal?: AbortSignal) {
    return this.request<ChessComStats>(`/player/${encodeURIComponent(username.toLowerCase())}/stats`, signal);
  }

  archives(username: string, signal?: AbortSignal) {
    return this.request<ChessComArchives>(`/player/${encodeURIComponent(username.toLowerCase())}/games/archives`, signal);
  }

  monthGames(username: string, year: number, month: number, signal?: AbortSignal) {
    return this.request<ChessComMonthGames>(`/player/${encodeURIComponent(username.toLowerCase())}/games/${year}/${String(month).padStart(2, '0')}`, signal);
  }

  monthPgn(username: string, year: number, month: number, signal?: AbortSignal) {
    return this.request<string>(`/player/${encodeURIComponent(username.toLowerCase())}/games/${year}/${String(month).padStart(2, '0')}/pgn`, signal, 'text');
  }
}

export const chessCom = new ChessComClient();

/** Extrai ano/mês de uma URL de arquivo: .../games/2024/03 */
export function parseArchiveUrl(url: string): { year: number; month: number } | null {
  const m = url.match(/\/games\/(\d{4})\/(\d{2})$/);
  return m ? { year: Number(m[1]), month: Number(m[2]) } : null;
}
