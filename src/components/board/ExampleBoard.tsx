import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, FlipVertical2 } from 'lucide-react';
import { ChessBoard, type BoardArrowShape } from './ChessBoard';
import { Button } from '@/components/ui/Button';
import { formatLine } from '@/lib/chess/board';
import { cn } from '@/lib/utils';

interface Step {
  fen: string;
  san: string | null;
  from: string | null;
  to: string | null;
}

/** Visualizador de linhas: posição inicial + lances em SAN, com navegação. */
export function ExampleBoard({ fen, moves = [], orientation = 'white', arrows, className, initialPly = 0, onPly }: { fen?: string; moves?: string[]; orientation?: 'white' | 'black'; arrows?: BoardArrowShape[]; className?: string; initialPly?: number; onPly?: (ply: number, fen: string) => void }) {
  const steps = useMemo<Step[]>(() => {
    const c = fen ? new Chess(fen) : new Chess();
    const out: Step[] = [{ fen: c.fen(), san: null, from: null, to: null }];
    for (const s of moves) {
      try {
        const m = c.move(s);
        out.push({ fen: c.fen(), san: m.san, from: m.from, to: m.to });
      } catch {
        break;
      }
    }
    return out;
  }, [fen, moves]);
  const [ply, setPlyState] = useState(Math.min(initialPly, steps.length - 1));
  const [flip, setFlip] = useState(false);
  const setPly = (p: number) => {
    const n = Math.max(0, Math.min(steps.length - 1, p));
    setPlyState(n);
    onPly?.(n, steps[n].fen);
  };
  const cur = steps[Math.min(ply, steps.length - 1)];
  const ori = flip ? (orientation === 'white' ? 'black' : 'white') : orientation;
  const startFen = steps[0].fen;
  const sans = steps.slice(1).map((s) => s.san!);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-hidden rounded-md border border-line">
        <ChessBoard fen={cur.fen} orientation={ori} movable={false} lastMove={cur.from ? [cur.from, cur.to!] : null} arrows={ply === 0 ? arrows : undefined} navigation />
      </div>
      {moves.length > 0 && (
        <>
          <div className="flex items-center justify-center gap-1">
            <Button size="icon-sm" variant="ghost" onClick={() => setPly(0)} aria-label="Início" disabled={ply === 0}>
              <ChevronFirst />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setPly(ply - 1)} aria-label="Anterior" disabled={ply === 0}>
              <ChevronLeft />
            </Button>
            <span className="w-16 text-center text-xs text-ink-muted tabular-nums">
              {ply}/{steps.length - 1}
            </span>
            <Button size="icon-sm" variant="ghost" onClick={() => setPly(ply + 1)} aria-label="Próximo" disabled={ply >= steps.length - 1}>
              <ChevronRight />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setPly(steps.length - 1)} aria-label="Fim" disabled={ply >= steps.length - 1}>
              <ChevronLast />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setFlip((f) => !f)} aria-label="Inverter">
              <FlipVertical2 />
            </Button>
          </div>
          <p className="text-center font-mono text-xs leading-relaxed text-ink-muted">
            {formatLine(startFen, sans)
              .split(' ')
              .map((tok, i, arr) => {
                // destaca o lance atual
                const sanIndex = arr.slice(0, i + 1).filter((t) => !/^\d+\.(\.\.)?$/.test(t)).length;
                const isMove = !/^\d+\.(\.\.)?$/.test(tok);
                return (
                  <button key={i} type="button" disabled={!isMove} onClick={() => isMove && setPly(sanIndex)} className={cn('px-0.5', isMove && sanIndex === ply ? 'rounded bg-accent-soft text-ink' : isMove ? 'hover:text-ink' : 'cursor-default')}>
                    {tok}
                  </button>
                );
              })}
          </p>
        </>
      )}
    </div>
  );
}
