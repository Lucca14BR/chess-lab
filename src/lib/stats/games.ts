// Estatísticas calculadas pelo Chess Lab a partir das partidas importadas.
import type { Color, ImportedGame, TimeClass } from '@/lib/db/schema';

export interface WDL {
  win: number;
  draw: number;
  loss: number;
  total: number;
  /** Pontuação: (V + E/2) / total, em %. */
  score: number;
}

export function wdl(games: ImportedGame[]): WDL {
  let win = 0;
  let draw = 0;
  let loss = 0;
  for (const g of games) {
    if (g.result === 'win') win++;
    else if (g.result === 'draw') draw++;
    else loss++;
  }
  const total = win + draw + loss;
  return { win, draw, loss, total, score: total ? Math.round(((win + draw / 2) / total) * 1000) / 10 : 0 };
}

export type Period = '30d' | '90d' | '6m' | '1y' | 'all';

export const PERIOD_LABEL: Record<Period, string> = {
  '30d': '30 dias',
  '90d': '90 dias',
  '6m': '6 meses',
  '1y': '12 meses',
  all: 'Tudo',
};

export function periodStart(p: Period, now = Date.now()): number {
  const day = 86400_000;
  switch (p) {
    case '30d':
      return now - 30 * day;
    case '90d':
      return now - 90 * day;
    case '6m':
      return now - 182 * day;
    case '1y':
      return now - 365 * day;
    default:
      return 0;
  }
}

export function filterGames(games: ImportedGame[], opts: { period?: Period; timeClass?: TimeClass | 'all'; color?: Color | 'all'; ratedOnly?: boolean; now?: number }) {
  const start = periodStart(opts.period ?? 'all', opts.now);
  return games.filter(
    (g) =>
      g.endTime >= start &&
      (!opts.timeClass || opts.timeClass === 'all' || g.timeClass === opts.timeClass) &&
      (!opts.color || opts.color === 'all' || g.userColor === opts.color) &&
      (!opts.ratedOnly || g.rated) &&
      g.rules === 'chess',
  );
}

export interface RatingPoint {
  t: number;
  rating: number;
}

/**
 * Série de rating de UM controle de tempo (nunca mistura Rapid/Blitz/Bullet).
 * Usa o rating registrado em cada partida ranqueada; um ponto por dia (último do dia).
 */
export function ratingSeries(games: ImportedGame[], timeClass: TimeClass): RatingPoint[] {
  const byDay = new Map<string, RatingPoint>();
  const sorted = games.filter((g) => g.timeClass === timeClass && g.rated && g.rules === 'chess' && g.userRating != null).sort((a, b) => a.endTime - b.endTime);
  for (const g of sorted) {
    const d = new Date(g.endTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    byDay.set(key, { t: g.endTime, rating: g.userRating! });
  }
  return [...byDay.values()];
}

export function groupBy<T>(items: T[], key: (t: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (k == null) continue;
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

export interface GroupStat extends WDL {
  key: string;
}

export function statsBy(games: ImportedGame[], key: (g: ImportedGame) => string | null): GroupStat[] {
  return [...groupBy(games, key).entries()].map(([k, gs]) => ({ key: k, ...wdl(gs) })).sort((a, b) => b.total - a.total);
}

export interface MonthStat extends WDL {
  month: string; // YYYY-MM
  t: number;
}

export function monthly(games: ImportedGame[]): MonthStat[] {
  return statsBy(games, (g) => {
    const d = new Date(g.endTime);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })
    .map((s) => {
      const [y, m] = s.key.split('-').map(Number);
      return { ...s, month: s.key, t: new Date(y, m - 1, 1).getTime() };
    })
    .sort((a, b) => a.t - b.t);
}

/** Matriz 7×24 (segunda=0) com contagem de partidas por dia da semana e hora local. */
export function weekdayHourMatrix(games: ImportedGame[]): number[][] {
  const m = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const g of games) {
    const d = new Date(g.endTime);
    m[(d.getDay() + 6) % 7][d.getHours()]++;
  }
  return m;
}

/** Partidas por semana (segunda-feira como início). */
export function weeklyCounts(games: ImportedGame[]): Array<{ t: number; count: number }> {
  const m = new Map<number, number>();
  for (const g of games) {
    const d = new Date(g.endTime);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    m.set(d.getTime(), (m.get(d.getTime()) ?? 0) + 1);
  }
  return [...m.entries()].map(([t, count]) => ({ t, count })).sort((a, b) => a.t - b.t);
}

export function ratingDelta(series: RatingPoint[], sinceMs: number): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const base = [...series].reverse().find((p) => p.t <= sinceMs) ?? series[0];
  if (base === last) return null;
  return last.rating - base.rating;
}

export function currentStreak(games: ImportedGame[]): { result: 'win' | 'loss' | 'draw'; count: number } | null {
  const sorted = [...games].sort((a, b) => b.endTime - a.endTime);
  if (!sorted.length) return null;
  const first = sorted[0].result;
  let count = 0;
  for (const g of sorted) {
    if (g.result !== first) break;
    count++;
  }
  return { result: first, count };
}
