// Sessão de treino cronometrada (estado global, persistido em localStorage para sobreviver a recarregamentos).
import { createStore } from '@/lib/store';
import { db, type ActivityType, type SessionBlock } from '@/lib/db/schema';
import { formatDuration, uid } from '@/lib/utils';

export interface RunnerState {
  running: boolean;
  paused: boolean;
  blocks: SessionBlock[];
  current: number;
  startedAt: number;
  /** Momento em que o bloco atual foi (re)iniciado; null quando pausado. */
  resumedAt: number | null;
  plannedId: string | null;
}

const KEY = 'chesslab-active-session';
const EMPTY: RunnerState = { running: false, paused: false, blocks: [], current: 0, startedAt: 0, resumedAt: null, plannedId: null };

function load(): RunnerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* ignora */
  }
  return EMPTY;
}

export const sessionStore = createStore<RunnerState>(typeof localStorage === 'undefined' ? EMPTY : load());

sessionStore.subscribe(() => {
  try {
    const s = sessionStore.get();
    if (s.running) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
});

/** Tempo decorrido no bloco atual (ms). */
export function currentBlockElapsed(s: RunnerState, now = Date.now()): number {
  const b = s.blocks[s.current];
  if (!b) return 0;
  return b.actualMs + (s.resumedAt ? now - s.resumedAt : 0);
}

function commitCurrent(s: RunnerState, now = Date.now()): SessionBlock[] {
  return s.blocks.map((b, i) => (i === s.current && s.resumedAt ? { ...b, actualMs: b.actualMs + (now - s.resumedAt) } : b));
}

export const sessionRunner = {
  start(blocks: Array<{ type: ActivityType; minutes: number; label: string }>, plannedId: string | null = null) {
    const now = Date.now();
    sessionStore.set({
      running: true,
      paused: false,
      blocks: blocks.map((b) => ({ ...b, done: false, actualMs: 0 })),
      current: 0,
      startedAt: now,
      resumedAt: now,
      plannedId,
    });
  },
  pause() {
    const s = sessionStore.get();
    if (!s.running || s.paused) return;
    sessionStore.set({ blocks: commitCurrent(s), paused: true, resumedAt: null });
  },
  resume() {
    const s = sessionStore.get();
    if (!s.running || !s.paused) return;
    sessionStore.set({ paused: false, resumedAt: Date.now() });
  },
  /** Conclui o bloco atual e avança. */
  completeBlock() {
    const s = sessionStore.get();
    const blocks = commitCurrent(s).map((b, i) => (i === s.current ? { ...b, done: true } : b));
    const next = Math.min(s.current + 1, blocks.length - 1);
    const finished = blocks.every((b) => b.done);
    sessionStore.set({ blocks, current: finished ? s.current : next, resumedAt: finished || s.paused ? null : Date.now(), paused: finished ? true : s.paused });
  },
  skipBlock() {
    const s = sessionStore.get();
    if (s.current >= s.blocks.length - 1) return;
    sessionStore.set({ blocks: commitCurrent(s), current: s.current + 1, resumedAt: s.paused ? null : Date.now() });
  },
  async finish(notes = '') {
    const s = sessionStore.get();
    if (!s.running) return null;
    const now = Date.now();
    const blocks = commitCurrent(s, now);
    const totalMs = blocks.reduce((a, b) => a + b.actualMs, 0);
    const id = uid();
    const status = blocks.every((b) => b.done) ? 'completed' : 'partial';
    await db.sessions.add({ id, startedAt: s.startedAt, endedAt: now, blocks, totalMs, status, notes });
    if (s.plannedId) await db.planned.update(s.plannedId, { done: true });
    sessionStore.set(EMPTY);
    await db.activity.add({
      id: uid(),
      kind: 'session',
      title: status === 'completed' ? 'Sessão de treino concluída' : 'Sessão de treino encerrada',
      detail: `${formatDuration(totalMs)} · ${blocks.filter((b) => b.done).length}/${blocks.length} blocos`,
      date: now,
      durationMs: totalMs,
      inSession: false,
      link: '/treino',
    });
    return id;
  },
  cancel() {
    sessionStore.set(EMPTY);
  },
};
