import { db } from '@/lib/db/schema';

// 'secrets' fica de fora de propósito: a chave da IA nunca vai para o backup.
// 'musicTracks' também: são arquivos de áudio grandes, que ficam só neste navegador.
const TABLES = ['account', 'archives', 'games', 'ownGames', 'analyses', 'positions', 'notes', 'collections', 'puzzleAttempts', 'puzzleFavorites', 'lessonProgress', 'repertoire', 'openingNotes', 'sessions', 'templates', 'planned', 'goals', 'activity', 'settings', 'tutorMessages', 'chatThreads'] as const;

export async function exportBackup(): Promise<string> {
  const tables: Record<string, unknown[]> = {};
  for (const t of TABLES) tables[t] = await db.table(t).toArray();
  return JSON.stringify({ app: 'chess-lab', version: 1, exportedAt: new Date().toISOString(), tables });
}

export async function importBackup(json: string): Promise<number> {
  let data: { app?: string; tables?: Record<string, unknown[]> };
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Arquivo inválido: não é um JSON.');
  }
  if (data.app !== 'chess-lab' || !data.tables) throw new Error('Este arquivo não é um backup do Chess Lab.');
  let count = 0;
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      const rows = data.tables![t];
      if (!Array.isArray(rows)) continue;
      await db.table(t).clear();
      await db.table(t).bulkPut(rows);
      count += rows.length;
    }
  });
  return count;
}

export async function clearAllData() {
  // 'secrets' (chave da IA) e 'musicTracks' ficam fora do backup, mas são apagadas junto com os dados
  await db.transaction('rw', [...TABLES.map((t) => db.table(t)), db.secrets, db.musicTracks], async () => {
    for (const t of TABLES) await db.table(t).clear();
    await db.secrets.clear();
    await db.musicTracks.clear();
  });
}

export async function storageSummary() {
  const counts: Record<string, number> = {};
  for (const t of TABLES) counts[t] = await db.table(t).count();
  const est = await navigator.storage?.estimate?.().catch(() => undefined);
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  return { counts, usage: est?.usage ?? null, quota: est?.quota ?? null, persisted: !!persisted };
}
