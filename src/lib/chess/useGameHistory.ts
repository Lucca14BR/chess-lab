import { useCallback, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { START_FEN } from './board';

export interface HistMove {
  san: string;
  uci: string;
  from: string;
  to: string;
  fen: string; // posição após o lance
  color: 'w' | 'b';
  comment: string;
}

export interface GameHistoryState {
  startFen: string;
  moves: HistMove[];
  /** Quantidade de lances aplicados (0 = posição inicial). */
  cursor: number;
}

/**
 * Histórico linear com cursor: voltar não apaga lances (refazer),
 * e jogar um lance diferente a partir de um ponto anterior substitui a continuação.
 */
export function useGameHistory(initialFen = START_FEN) {
  const [state, setState] = useState<GameHistoryState>({ startFen: initialFen, moves: [], cursor: 0 });

  const fen = state.cursor === 0 ? state.startFen : state.moves[state.cursor - 1].fen;
  const current = state.cursor > 0 ? state.moves[state.cursor - 1] : null;

  const ref = useRef(state);
  ref.current = state;

  /** Aplica um lance a partir do cursor; retorna o lance (ou null se ilegal). */
  const apply = useCallback((move: string | { from: string; to: string; promotion?: string }): HistMove | null => {
    const s = ref.current;
    const base = s.cursor === 0 ? s.startFen : s.moves[s.cursor - 1].fen;
    const c = new Chess(base);
    let mv;
    try {
      mv = c.move(move);
    } catch {
      return null;
    }
    const uci = mv.from + mv.to + (mv.promotion ?? '');
    let next: GameHistoryState;
    let played: HistMove;
    if (s.moves[s.cursor]?.uci === uci) {
      // Mesmo lance da continuação existente: apenas avança.
      played = s.moves[s.cursor];
      next = { ...s, cursor: s.cursor + 1 };
    } else {
      played = { san: mv.san, uci, from: mv.from, to: mv.to, fen: c.fen(), color: mv.color, comment: '' };
      next = { ...s, moves: [...s.moves.slice(0, s.cursor), played], cursor: s.cursor + 1 };
    }
    ref.current = next;
    setState(next);
    return played;
  }, []);

  const play = useCallback((from: string, to: string, promotion?: string) => apply({ from, to, promotion }), [apply]);
  const playSan = useCallback((san: string) => apply(san), [apply]);

  const goTo = useCallback((cursor: number) => setState((s) => ({ ...s, cursor: Math.max(0, Math.min(s.moves.length, cursor)) })), []);
  const undo = useCallback(() => setState((s) => ({ ...s, cursor: Math.max(0, s.cursor - 1) })), []);
  const redo = useCallback(() => setState((s) => ({ ...s, cursor: Math.min(s.moves.length, s.cursor + 1) })), []);
  const reset = useCallback((startFen = START_FEN) => setState({ startFen, moves: [], cursor: 0 }), []);
  const load = useCallback((startFen: string, moves: HistMove[], cursor = moves.length) => setState({ startFen, moves, cursor }), []);
  /** Remove os lances depois do cursor. */
  const truncate = useCallback(() => setState((s) => ({ ...s, moves: s.moves.slice(0, s.cursor) })), []);
  const setComment = useCallback((index: number, comment: string) => {
    setState((s) => ({ ...s, moves: s.moves.map((m, i) => (i === index ? { ...m, comment } : m)) }));
  }, []);

  const chess = useMemo(() => new Chess(fen), [fen]);

  return { ...state, fen, current, chess, play, playSan, goTo, undo, redo, reset, load, truncate, setComment, canUndo: state.cursor > 0, canRedo: state.cursor < state.moves.length };
}

export type GameHistory = ReturnType<typeof useGameHistory>;
