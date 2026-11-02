// Métricas de estudo e puzzles registradas localmente pelo Chess Lab.
import type { ActivityLog, LessonProgress, PuzzleAttempt, TrainingSession, Goal } from '@/lib/db/schema';
import type { PuzzleCategory } from '@/data/academy/types';
import { isoDay, startOfWeek, addDays } from '@/lib/utils';

export interface ThemeStat {
  category: PuzzleCategory;
  attempts: number;
  solved: number;
  accuracy: number;
  avgTimeMs: number;
}

export function puzzleThemeStats(attempts: PuzzleAttempt[]): ThemeStat[] {
  const m = new Map<PuzzleCategory, PuzzleAttempt[]>();
  for (const a of attempts) {
    const arr = m.get(a.category) ?? [];
    arr.push(a);
    m.set(a.category, arr);
  }
  return [...m.entries()].map(([category, list]) => {
    const solved = list.filter((a) => a.solved).length;
    return {
      category,
      attempts: list.length,
      solved,
      accuracy: Math.round((solved / list.length) * 100),
      avgTimeMs: Math.round(list.reduce((s, a) => s + a.timeMs, 0) / list.length),
    };
  });
}

/** Temas com pior taxa de acerto (mínimo de tentativas para evitar conclusões precipitadas). */
export function weakestThemes(attempts: PuzzleAttempt[], minAttempts = 4): ThemeStat[] {
  return puzzleThemeStats(attempts)
    .filter((t) => t.attempts >= minAttempts)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
}

/** Pontuação do Chess Lab: soma de pontos de tentativas (não é rating oficial). */
export function puzzleScore(attempts: PuzzleAttempt[]): number {
  return attempts.reduce((s, a) => s + a.points, 0);
}

export function puzzlePoints(rating: number, solved: boolean, hintUsed: boolean): number {
  if (!solved) return 0;
  const base = Math.max(5, Math.round(rating / 100));
  return hintUsed ? Math.ceil(base / 2) : base;
}

export interface DailyPuzzle {
  day: string;
  attempts: number;
  solved: number;
}

export function puzzlesPerDay(attempts: PuzzleAttempt[]): DailyPuzzle[] {
  const m = new Map<string, DailyPuzzle>();
  for (const a of attempts) {
    const day = isoDay(a.date);
    const e = m.get(day) ?? { day, attempts: 0, solved: 0 };
    e.attempts++;
    if (a.solved) e.solved++;
    m.set(day, e);
  }
  return [...m.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Tempo de estudo por dia (ms), separado por origem.
 * Atividades registradas durante uma sessão cronometrada não são somadas de novo.
 */
export function studyTimeByDay(sessions: TrainingSession[], activity: ActivityLog[]) {
  const m = new Map<string, { day: string; sessions: number; puzzles: number; lessons: number; other: number }>();
  const get = (day: string) => {
    let e = m.get(day);
    if (!e) {
      e = { day, sessions: 0, puzzles: 0, lessons: 0, other: 0 };
      m.set(day, e);
    }
    return e;
  };
  for (const s of sessions) get(isoDay(s.startedAt)).sessions += s.totalMs;
  for (const a of activity) {
    if (a.inSession || !a.durationMs || a.kind === 'session') continue;
    const e = get(isoDay(a.date));
    if (a.kind === 'puzzle') e.puzzles += a.durationMs;
    else if (a.kind === 'lesson') e.lessons += a.durationMs;
    else e.other += a.durationMs;
  }
  return [...m.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export function totalStudyMs(sessions: TrainingSession[], activity: ActivityLog[], sinceMs = 0): number {
  return studyTimeByDay(
    sessions.filter((s) => s.startedAt >= sinceMs),
    activity.filter((a) => a.date >= sinceMs),
  ).reduce((s, d) => s + d.sessions + d.puzzles + d.lessons + d.other, 0);
}

/** Dias consecutivos (até hoje ou ontem) com alguma atividade de estudo. */
export function studyStreak(activeDays: Set<string>, today = new Date()): number {
  let d = new Date(today);
  if (!activeDays.has(isoDay(d))) d = addDays(d, -1);
  let n = 0;
  while (activeDays.has(isoDay(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function activeDaysSet(sessions: TrainingSession[], activity: ActivityLog[], attempts: PuzzleAttempt[]): Set<string> {
  const s = new Set<string>();
  for (const x of sessions) s.add(isoDay(x.startedAt));
  for (const x of attempts) s.add(isoDay(x.date));
  for (const x of activity) if (x.kind === 'lesson' || x.kind === 'analysis' || x.kind === 'opening') s.add(isoDay(x.date));
  return s;
}

export interface GoalProgressInput {
  attempts: PuzzleAttempt[];
  lessons: LessonProgress[];
  sessions: TrainingSession[];
  activity: ActivityLog[];
  gamesInWeek: number;
}

export function weekBounds(weekIso: string) {
  const [y, m, d] = weekIso.split('-').map(Number);
  const start = new Date(y, m - 1, d).getTime();
  return { start, end: addDays(new Date(start), 7).getTime() };
}

export function currentWeekIso(now = new Date()) {
  return isoDay(startOfWeek(now));
}

export function goalProgress(goal: Goal, weekIso: string, input: GoalProgressInput): number {
  const { start, end } = weekBounds(weekIso);
  const inWeek = (t: number) => t >= start && t < end;
  switch (goal.metric) {
    case 'puzzles_solved':
      return input.attempts.filter((a) => a.solved && inWeek(a.date)).length;
    case 'lessons_completed':
      return input.lessons.filter((l) => l.completedAt && inWeek(l.completedAt)).length;
    case 'study_minutes':
      return Math.round(
        totalStudyMs(
          input.sessions.filter((s) => inWeek(s.startedAt)),
          input.activity.filter((a) => inWeek(a.date)),
        ) / 60000,
      );
    case 'sessions_completed':
      return input.sessions.filter((s) => inWeek(s.startedAt)).length;
    case 'games_played':
      return input.gamesInWeek;
    default:
      return goal.manualProgress[weekIso] ?? 0;
  }
}
