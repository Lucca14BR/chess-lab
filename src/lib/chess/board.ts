import { Chess, type Square } from 'chess.js';
import type { Key } from '@lichess-org/chessground/types';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Destinos legais no formato do Chessground. */
export function legalDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  for (const m of chess.moves({ verbose: true })) {
    const arr = dests.get(m.from as Key);
    if (arr) arr.push(m.to as Key);
    else dests.set(m.from as Key, [m.to as Key]);
  }
  return dests;
}

export function turnColor(chess: Chess): 'white' | 'black' {
  return chess.turn() === 'w' ? 'white' : 'black';
}

export function isPromotion(chess: Chess, from: string, to: string): boolean {
  const piece = chess.get(from as Square);
  if (!piece || piece.type !== 'p') return false;
  return (piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1');
}

export function validateFen(fen: string): string | null {
  try {
    new Chess(fen.trim());
    return null;
  } catch (e) {
    return `FEN inválida: ${(e as Error).message}`;
  }
}

/** Chave estável de posição (sem contadores de lances). */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

export function uciToSan(fen: string, uci: string): string | null {
  try {
    const c = new Chess(fen);
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return m.san;
  } catch {
    return null;
  }
}

/** Converte uma sequência UCI em SAN a partir da FEN. */
export function pvToSan(fen: string, pv: string[], max = 12): string[] {
  const out: string[] = [];
  try {
    const c = new Chess(fen);
    for (const uci of pv.slice(0, max)) {
      const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      out.push(m.san);
    }
  } catch {
    /* linha interrompida */
  }
  return out;
}

/** Formata uma linha SAN com numeração a partir da FEN. */
export function formatLine(fen: string, sans: string[]): string {
  const parts = fen.split(' ');
  let n = Number(parts[5]) || 1;
  let white = parts[1] === 'w';
  const out: string[] = [];
  sans.forEach((s, i) => {
    if (white) out.push(`${n}.`);
    else if (i === 0) out.push(`${n}...`);
    out.push(s);
    if (!white) n++;
    white = !white;
  });
  return out.join(' ');
}

export function fenAfter(sans: string[], startFen?: string): string {
  const c = startFen ? new Chess(startFen) : new Chess();
  for (const s of sans) c.move(s);
  return c.fen();
}
