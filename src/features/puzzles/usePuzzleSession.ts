import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import type { Puzzle } from '@/lib/puzzles';
import { db } from '@/lib/db/schema';
import { puzzlePoints } from '@/lib/stats/study';
import { logActivity } from '@/lib/services/activity';
import { CATEGORY_INFO } from '@/lib/puzzles';
import { playSfx } from '@/lib/audio/sfx';
import { uid } from '@/lib/utils';

export type PuzzleStatus = 'loading' | 'opponent' | 'playing' | 'solved' | 'failed';

function applyUci(c: Chess, uci: string) {
  return c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
}

/** Controla um puzzle: lance inicial do adversário, validação, respostas automáticas e registro da tentativa. */
export function usePuzzleSession(puzzle: Puzzle | null) {
  const [fen, setFen] = useState<string>('8/8/8/8/8/8/8/8 w - - 0 1');
  const [lastMove, setLastMove] = useState<[string, string] | null>(null);
  const [status, setStatus] = useState<PuzzleStatus>('loading');
  const [step, setStep] = useState(1); // índice em puzzle.moves do próximo lance do aluno
  const [wrong, setWrong] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [syncToken, setSyncToken] = useState(0);
  const chess = useRef(new Chess());
  const startedAt = useRef(0);
  const recorded = useRef(false);
  const hintUsed = useRef(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    clearTimers();
    if (!puzzle) return;
    const c = new Chess(puzzle.fen);
    chess.current = c;
    setFen(c.fen());
    setLastMove(null);
    setStatus('opponent');
    setStep(1);
    setWrong(null);
    setHint(null);
    setElapsed(0);
    recorded.current = false;
    hintUsed.current = false;
    timers.current.push(
      window.setTimeout(() => {
        const m = applyUci(c, puzzle.moves[0]);
        setFen(c.fen());
        setLastMove([m.from, m.to]);
        setStatus('playing');
        startedAt.current = Date.now();
      }, 550),
    );
    return clearTimers;
  }, [puzzle]);

  // cronômetro
  useEffect(() => {
    if (status !== 'playing' && status !== 'opponent') return;
    const t = window.setInterval(() => startedAt.current && setElapsed(Date.now() - startedAt.current), 250);
    return () => clearInterval(t);
  }, [status]);

  const record = useCallback(
    async (solved: boolean) => {
      if (!puzzle || recorded.current) return;
      recorded.current = true;
      const timeMs = Date.now() - startedAt.current;
      setElapsed(timeMs);
      const points = puzzlePoints(puzzle.rating, solved, hintUsed.current);
      await db.puzzleAttempts.add({ id: uid(), puzzleId: puzzle.id, category: puzzle.category, level: puzzle.level, rating: puzzle.rating, solved, hintUsed: hintUsed.current, timeMs, points, date: Date.now() });
      await logActivity({ kind: 'puzzle', title: solved ? 'Puzzle resolvido' : 'Puzzle não resolvido', detail: `${CATEGORY_INFO[puzzle.category].label} · ${puzzle.rating}`, durationMs: timeMs, link: `/puzzles?id=${puzzle.id}` });
    },
    [puzzle],
  );

  const userMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (!puzzle || (status !== 'playing' && status !== 'failed')) return;
      const c = chess.current;
      const expected = puzzle.moves[step];
      const uci = from + to + (promotion ?? '');
      const isLast = step === puzzle.moves.length - 1;
      const probe = new Chess(c.fen());
      let mv;
      try {
        mv = probe.move({ from, to, promotion });
      } catch {
        setSyncToken((n) => n + 1);
        return;
      }
      // Na última jogada, qualquer xeque-mate é aceito (critério usado pela Lichess).
      const correct = uci === expected || (isLast && probe.isCheckmate());
      if (!correct) {
        playSfx('LowTime');
        setWrong(mv.san);
        setSyncToken((n) => n + 1);
        if (status === 'playing') {
          setStatus('failed');
          void record(false);
        }
        return;
      }
      setWrong(null);
      setHint(null);
      applyUci(c, uci);
      setFen(c.fen());
      setLastMove([from, to]);
      if (isLast) {
        if (status === 'playing') {
          playSfx('GenericNotify');
          setStatus('solved');
          void record(true);
        } else setStatus('failed');
        return;
      }
      const reply = puzzle.moves[step + 1];
      setStep(step + 2);
      timers.current.push(
        window.setTimeout(() => {
          const m = applyUci(c, reply);
          setFen(c.fen());
          setLastMove([m.from, m.to]);
        }, 380),
      );
    },
    [puzzle, status, step, record],
  );

  const showHint = useCallback(() => {
    if (!puzzle || status !== 'playing') return;
    hintUsed.current = true;
    setHint(puzzle.moves[step].slice(0, 2));
  }, [puzzle, status, step]);

  /** Desiste e mostra a solução lance a lance. */
  const revealSolution = useCallback(() => {
    if (!puzzle) return;
    if (status === 'playing') void record(false);
    setStatus('failed');
    const c = chess.current;
    let i = step;
    const play = () => {
      if (i >= puzzle.moves.length) return;
      const m = applyUci(c, puzzle.moves[i]);
      setFen(c.fen());
      setLastMove([m.from, m.to]);
      i++;
      setStep(i);
      if (i < puzzle.moves.length) timers.current.push(window.setTimeout(play, 650));
    };
    play();
  }, [puzzle, status, step, record]);

  const userColor: 'white' | 'black' = puzzle ? (new Chess(puzzle.fen).turn() === 'w' ? 'black' : 'white') : 'white';
  const done = !!puzzle && step >= puzzle.moves.length;

  return { fen, lastMove, status, wrong, hint, elapsed, userColor, userMove, showHint, revealSolution, syncToken, done };
}

/** Solução completa em SAN (para a explicação). */
export function solutionSan(p: Puzzle): string[] {
  const c = new Chess(p.fen);
  return p.moves.map((u) => applyUci(c, u).san);
}
