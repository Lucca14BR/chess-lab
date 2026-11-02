import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ImportedGame } from '@/lib/db/schema';

export function useAccount() {
  // null = sem conta conectada; undefined = ainda carregando
  return useLiveQuery(async () => (await db.account.get('chesscom')) ?? null, []);
}

/** Partidas da conta conectada (undefined enquanto carrega). */
export function useImportedGames(): ImportedGame[] | undefined {
  return useLiveQuery(async () => {
    const acc = await db.account.get('chesscom');
    if (!acc) return [];
    return db.games.where('username').equals(acc.username).toArray();
  }, []);
}

export function useStudyData() {
  return useLiveQuery(async () => {
    const [attempts, lessons, sessions, activity, goals, planned] = await Promise.all([
      db.puzzleAttempts.toArray(),
      db.lessonProgress.toArray(),
      db.sessions.toArray(),
      db.activity.toArray(),
      db.goals.toArray(),
      db.planned.toArray(),
    ]);
    return { attempts, lessons, sessions, activity, goals, planned };
  }, []);
}

export type StudyData = NonNullable<ReturnType<typeof useStudyData>>;
