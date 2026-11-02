// Sincronização em série com o Chess.com, com cache local (IndexedDB) e progresso observável.
import { createStore } from '@/lib/store';
import { db, type AccountRow, type ImportScope } from '@/lib/db/schema';
import { ChessComClient, ChessComError, chessCom, parseArchiveUrl, validateUsername } from './client';
import { normalizeGame } from './normalize';
import { uid } from '@/lib/utils';

export interface SyncState {
  running: boolean;
  step: string;
  done: number;
  total: number;
  newGames: number;
  error: string | null;
  rateLimitedUntil: number | null;
}

export const syncStore = createStore<SyncState>({ running: false, step: '', done: 0, total: 0, newGames: 0, error: null, rateLimitedUntil: null });

let controller: AbortController | null = null;

/** A API pode atrasar até 12 h; um mês só é tratado como fechado 24 h depois do fim. */
const CLOSE_MARGIN_MS = 24 * 3600 * 1000;
const PROFILE_TTL_MS = 10 * 60 * 1000;

export function monthEndUtc(year: number, month: number): number {
  return Date.UTC(year, month, 1); // primeiro instante do mês seguinte
}

export function archivesInScope(urls: string[], scope: ImportScope, now = new Date()): string[] {
  if (scope === 'all') return urls;
  const months = scope === '3m' ? 3 : 12;
  const minIndex = now.getUTCFullYear() * 12 + now.getUTCMonth() - (months - 1);
  return urls.filter((u) => {
    const p = parseArchiveUrl(u);
    return p ? p.year * 12 + (p.month - 1) >= minIndex : false;
  });
}

function friendly(e: unknown): string {
  if (e instanceof ChessComError) return e.message;
  return 'Erro inesperado durante a sincronização.';
}

export async function getAccount(): Promise<AccountRow | undefined> {
  return db.account.get('chesscom');
}

/** Valida e busca o perfil, sem gravar nada. */
export async function lookupProfile(rawUsername: string, client: ChessComClient = chessCom) {
  const invalid = validateUsername(rawUsername);
  if (invalid) throw new ChessComError('invalid', invalid);
  try {
    return await client.profile(rawUsername.trim());
  } catch (e) {
    if (e instanceof ChessComError && e.kind === 'not_found') {
      throw new ChessComError('not_found', `O usuário "${rawUsername.trim()}" não foi encontrado no Chess.com.`, 404);
    }
    throw e;
  }
}

export async function connectAccount(rawUsername: string, scope: ImportScope, client: ChessComClient = chessCom) {
  const profile = await lookupProfile(rawUsername, client);
  const username = profile.username.toLowerCase();
  const existing = await getAccount();
  if (existing && existing.username !== username) {
    await removeImportedData();
  }
  await db.account.put({
    id: 'chesscom',
    username,
    displayUsername: profile.username,
    profile,
    stats: existing?.username === username ? existing.stats : null,
    connectedAt: existing?.username === username ? existing.connectedAt : Date.now(),
    importScope: scope,
    lastProfileSyncAt: Date.now(),
    lastStatsSyncAt: existing?.username === username ? existing.lastStatsSyncAt : null,
    lastGamesSyncAt: existing?.username === username ? existing.lastGamesSyncAt : null,
    lastSyncError: null,
  });
  void syncAccount({ client });
}

export async function removeImportedData() {
  await db.transaction('rw', db.account, db.archives, db.games, async () => {
    await db.account.clear();
    await db.archives.clear();
    await db.games.clear();
  });
}

export async function disconnectAccount(keepGames: boolean) {
  cancelSync();
  if (keepGames) await db.account.clear();
  else await removeImportedData();
}

export function cancelSync() {
  controller?.abort();
}

export async function syncAccount(opts: { force?: boolean; client?: ChessComClient } = {}) {
  const client = opts.client ?? chessCom;
  if (syncStore.get().running) return;
  // Marca como em execução antes de qualquer await para impedir sincronizações simultâneas.
  syncStore.set({ running: true, step: 'Preparando…', error: null });
  const account = await getAccount();
  if (!account) {
    syncStore.set({ running: false, step: '' });
    return;
  }
  controller = new AbortController();
  const signal = controller.signal;
  client.onRateLimit = (wait) => syncStore.set({ rateLimitedUntil: Date.now() + wait, step: 'Limite de requisições atingido; aguardando para tentar de novo…' });
  syncStore.set({ running: true, step: 'Atualizando perfil…', done: 0, total: 0, newGames: 0, error: null, rateLimitedUntil: null });
  const user = account.username;
  let newGames = 0;
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new ChessComError('network', 'Sem conexão com a internet. Os dados locais continuam disponíveis.');
    }
    const now = Date.now();
    if (opts.force || !account.lastProfileSyncAt || now - account.lastProfileSyncAt > PROFILE_TTL_MS) {
      const profile = await client.profile(user, signal);
      await db.account.update('chesscom', { profile, displayUsername: profile.username, lastProfileSyncAt: Date.now() });
    }
    syncStore.set({ step: 'Importando estatísticas…', rateLimitedUntil: null });
    const stats = await client.stats(user, signal);
    await db.account.update('chesscom', { stats, lastStatsSyncAt: Date.now() });

    syncStore.set({ step: 'Listando arquivos de partidas…' });
    const { archives } = await client.archives(user, signal);
    const scoped = archivesInScope(archives, account.importScope).reverse(); // mais recentes primeiro
    const known = new Map((await db.archives.where('username').equals(user).toArray()).map((a) => [a.url, a]));
    const pending = scoped.filter((u) => !known.get(u)?.complete);
    syncStore.set({ total: pending.length, done: 0 });

    for (const url of pending) {
      const p = parseArchiveUrl(url);
      if (!p) continue;
      syncStore.set({ step: `Importando partidas de ${String(p.month).padStart(2, '0')}/${p.year}…`, rateLimitedUntil: null });
      const { games } = await client.monthGames(user, p.year, p.month, signal);
      const rows = games.map((g) => normalizeGame(g, user)).filter((g) => g !== null);
      const existingIds = new Set((await db.games.where('archive').equals(`${p.year}/${String(p.month).padStart(2, '0')}`).primaryKeys()) as string[]);
      newGames += rows.filter((r) => !existingIds.has(r.id)).length;
      const fetchedAt = Date.now();
      await db.transaction('rw', db.games, db.archives, async () => {
        await db.games.bulkPut(rows);
        await db.archives.put({
          url,
          username: user,
          year: p.year,
          month: p.month,
          fetchedAt,
          gameCount: rows.length,
          complete: fetchedAt > monthEndUtc(p.year, p.month) + CLOSE_MARGIN_MS,
        });
      });
      syncStore.set((s) => ({ done: s.done + 1, newGames }));
    }
    await db.account.update('chesscom', { lastGamesSyncAt: Date.now(), lastSyncError: null });
    await db.activity.add({
      id: uid(),
      kind: 'sync',
      title: 'Dados do Chess.com sincronizados',
      detail: newGames ? `${newGames} nova${newGames > 1 ? 's' : ''} partida${newGames > 1 ? 's' : ''}` : 'Nenhuma partida nova',
      date: Date.now(),
      durationMs: 0,
      inSession: false,
      link: '/desempenho',
    });
    syncStore.set({ running: false, step: 'Sincronização concluída.', error: null, rateLimitedUntil: null });
  } catch (e) {
    const aborted = e instanceof ChessComError && e.kind === 'aborted';
    const msg = aborted ? null : friendly(e);
    if (msg) await db.account.update('chesscom', { lastSyncError: msg });
    syncStore.set({ running: false, step: aborted ? 'Sincronização cancelada.' : '', error: msg, rateLimitedUntil: null });
  } finally {
    controller = null;
  }
}

/** Sincroniza ao abrir o app quando os dados têm mais de 12 h. */
export async function maybeAutoSync(enabled: boolean) {
  if (!enabled) return;
  const account = await getAccount();
  if (!account) return;
  const last = account.lastGamesSyncAt ?? 0;
  if (Date.now() - last > 12 * 3600 * 1000) void syncAccount();
}
