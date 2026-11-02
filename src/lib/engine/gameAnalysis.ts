// Análise completa de partida com Stockfish: avaliação de cada posição, perda por lance e classificação.
import { Chess } from 'chess.js';
import { engine, evalToCp, winChance, ENGINE_NAME } from './stockfish';
import type { AnalyzedMove, GameAnalysis, MoveClass, SideSummary } from '@/lib/db/schema';
import { uciToSan } from '@/lib/chess/board';

export interface MoveInput {
  san: string;
  fenBefore: string;
  fenAfter: string;
  uci: string;
  color: 'w' | 'b';
}

/** Limiares de perda de chance de vitória (mesma escala usada pela Lichess). */
export function classify(winLoss: number, isBest: boolean): MoveClass {
  if (isBest) return 'best';
  if (winLoss >= 30) return 'blunder';
  if (winLoss >= 20) return 'mistake';
  if (winLoss >= 10) return 'inaccuracy';
  return 'good';
}

/** Precisão por lance a partir da perda de chance de vitória (fórmula pública da Lichess). */
export function moveAccuracy(winLoss: number): number {
  const a = 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669;
  return Math.max(0, Math.min(100, a));
}

export function summarize(moves: AnalyzedMove[], color: 'white' | 'black'): SideSummary {
  const mine = moves.filter((m) => m.color === color);
  if (!mine.length) return { acpl: 0, inaccuracies: 0, mistakes: 0, blunders: 0, accuracy: 0 };
  const cpLoss = mine.map((m) => {
    const before = Math.max(-1000, Math.min(1000, m.evalBefore));
    const after = Math.max(-1000, Math.min(1000, m.evalAfter));
    return Math.max(0, color === 'white' ? before - after : after - before);
  });
  return {
    acpl: Math.round(cpLoss.reduce((a, b) => a + b, 0) / mine.length),
    inaccuracies: mine.filter((m) => m.classification === 'inaccuracy').length,
    mistakes: mine.filter((m) => m.classification === 'mistake').length,
    blunders: mine.filter((m) => m.classification === 'blunder').length,
    accuracy: Math.round((mine.reduce((s, m) => s + moveAccuracy(m.winLoss), 0) / mine.length) * 10) / 10,
  };
}

export async function analyzeGame(
  input: { id: string; kind: GameAnalysis['kind']; gameId: string; title: string; moves: MoveInput[] },
  opts: { depth: number; onProgress?: (done: number, total: number) => void; signal?: AbortSignal },
): Promise<GameAnalysis> {
  const fens = [input.moves[0]?.fenBefore ?? new Chess().fen(), ...input.moves.map((m) => m.fenAfter)];
  const evals: Array<{ cp: number; mate: number | null; best: string | null }> = [];
  for (let i = 0; i < fens.length; i++) {
    if (opts.signal?.aborted) throw new Error('Análise cancelada.');
    const chess = new Chess(fens[i]);
    if (chess.isGameOver()) {
      const cp = chess.isCheckmate() ? (chess.turn() === 'w' ? -10000 : 10000) : 0;
      evals.push({ cp, mate: chess.isCheckmate() ? 0 : null, best: null });
    } else {
      const r = await engine.analyze(fens[i], { depth: opts.depth, signal: opts.signal });
      const top = r.lines[0];
      evals.push({ cp: top ? evalToCp(top) : 0, mate: top?.mate ?? null, best: r.bestMove });
    }
    opts.onProgress?.(i + 1, fens.length);
  }
  const moves: AnalyzedMove[] = input.moves.map((m, i) => {
    const before = evals[i];
    const after = evals[i + 1];
    const white = m.color === 'w';
    const wcBefore = winChance(before.cp);
    const wcAfter = winChance(after.cp);
    const winLoss = Math.max(0, white ? wcBefore - wcAfter : wcAfter - wcBefore);
    const isBest = before.best === m.uci;
    return {
      ply: i + 1,
      san: m.san,
      uci: m.uci,
      color: white ? 'white' : 'black',
      fenBefore: m.fenBefore,
      evalBefore: before.cp,
      evalAfter: after.cp,
      mateAfter: after.mate,
      bestUci: before.best ?? '',
      bestSan: before.best ? uciToSan(m.fenBefore, before.best) ?? before.best : '',
      winLoss: Math.round(winLoss * 10) / 10,
      classification: classify(winLoss, isBest),
    };
  });
  return {
    id: input.id,
    kind: input.kind,
    gameId: input.gameId,
    title: input.title,
    depth: opts.depth,
    engine: ENGINE_NAME,
    createdAt: Date.now(),
    moves,
    white: summarize(moves, 'white'),
    black: summarize(moves, 'black'),
  };
}

export const MOVE_CLASS_LABEL: Record<MoveClass, string> = {
  best: 'Melhor lance',
  good: 'Bom',
  inaccuracy: 'Imprecisão',
  mistake: 'Erro',
  blunder: 'Erro grave',
};
