import type { ChessComGame } from './types';
import type { Color, GameResult, ImportedGame, TimeClass } from '@/lib/db/schema';

const DRAW_CODES = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient']);

export const RESULT_LABELS: Record<string, string> = {
  win: 'Vitória',
  checkmated: 'Xeque-mate',
  agreed: 'Empate por acordo',
  repetition: 'Repetição',
  timeout: 'Tempo esgotado',
  resigned: 'Abandono',
  stalemate: 'Afogamento',
  lose: 'Derrota',
  insufficient: 'Material insuficiente',
  '50move': 'Regra dos 50 lances',
  abandoned: 'Partida abandonada',
  timevsinsufficient: 'Tempo vs. material insuficiente',
};

export function sideResult(code: string): GameResult {
  if (code === 'win') return 'win';
  if (DRAW_CODES.has(code)) return 'draw';
  return 'loss';
}

export function pgnHeader(pgn: string, tag: string): string | null {
  const m = pgn.match(new RegExp(`\\[${tag} "([^"]*)"\\]`));
  return m ? m[1] : null;
}

/** "https://www.chess.com/openings/Pirc-Defense-Main-Line...5.Qd2-c6" -> "Pirc Defense Main Line" */
export function openingNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const slug = url.split('/openings/')[1];
  if (!slug) return null;
  const namePart = slug.split(/\.\.\.|-\d+\./)[0];
  const name = decodeURIComponent(namePart).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  return name || null;
}

const FAMILY_KEYWORDS = ['Defense', 'Game', 'Opening', 'Gambit', 'Attack', 'System', 'Indian'];

/** Agrupa variantes em uma família: "Sicilian Defense Najdorf Variation" -> "Sicilian Defense". */
export function openingFamily(name: string | null): string | null {
  if (!name) return null;
  const words = name.split(' ');
  const idx = words.findIndex((w) => FAMILY_KEYWORDS.includes(w));
  if (idx >= 0) return words.slice(0, idx + 1).join(' ');
  return words.slice(0, Math.min(2, words.length)).join(' ');
}

export function normalizeTimeClass(tc: string): TimeClass | null {
  return tc === 'bullet' || tc === 'blitz' || tc === 'rapid' || tc === 'daily' ? tc : null;
}

export function normalizeGame(g: ChessComGame, username: string): ImportedGame | null {
  const user = username.toLowerCase();
  const timeClass = normalizeTimeClass(g.time_class);
  if (!timeClass) return null;
  const isWhite = g.white.username.toLowerCase() === user;
  const isBlack = g.black.username.toLowerCase() === user;
  if (!isWhite && !isBlack) return null;
  const userColor: Color = isWhite ? 'white' : 'black';
  const me = isWhite ? g.white : g.black;
  const opp = isWhite ? g.black : g.white;
  const pgn = g.pgn ?? '';
  const ecoUrl = g.eco ?? pgnHeader(pgn, 'ECOUrl');
  const openingName = openingNameFromUrl(ecoUrl);
  const endTime = g.end_time * 1000;
  const d = new Date(endTime);
  return {
    id: g.uuid ?? g.url,
    username: user,
    url: g.url,
    endTime,
    timeClass,
    timeControl: g.time_control,
    rated: g.rated,
    rules: g.rules,
    white: { username: g.white.username, rating: g.white.rating ?? null, result: g.white.result },
    black: { username: g.black.username, rating: g.black.rating ?? null, result: g.black.result },
    userColor,
    result: sideResult(me.result),
    resultDetail: me.result === 'win' ? opp.result : me.result,
    userRating: me.rating ?? null,
    opponentRating: opp.rating ?? null,
    opponent: opp.username,
    eco: pgnHeader(pgn, 'ECO'),
    openingName,
    openingFamily: openingFamily(openingName),
    pgn,
    accuracies: g.accuracies ?? null,
    archive: `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
  };
}

export const TIME_CLASS_LABEL: Record<TimeClass, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rápida',
  daily: 'Diária',
};

export function formatTimeControl(tc: string): string {
  if (tc.includes('/')) {
    const secs = Number(tc.split('/')[1]);
    const days = Math.round(secs / 86400);
    return `${days} dia${days > 1 ? 's' : ''} por lance`;
  }
  const [base, inc] = tc.split('+').map(Number);
  const min = base / 60;
  const minStr = min >= 1 ? `${Number.isInteger(min) ? min : min.toFixed(1)} min` : `${base} s`;
  return inc ? `${minStr} + ${inc} s` : minStr;
}

export function modeStats(stats: import('./types').ChessComStats | null | undefined, tc: TimeClass) {
  return stats?.[`chess_${tc}` as const];
}
