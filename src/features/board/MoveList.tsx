import { useEffect, useRef } from 'react';
import type { HistMove } from '@/lib/chess/useGameHistory';
import type { AnalyzedMove, MoveClass } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

const CLASS_DOT: Record<MoveClass, string> = {
  best: 'bg-positive',
  good: '',
  inaccuracy: 'bg-warning',
  mistake: 'bg-[#d38b4a]',
  blunder: 'bg-negative',
};

export function MoveList({ startFen, moves, cursor, onGo, notation, analysis }: { startFen: string; moves: HistMove[]; cursor: number; onGo: (i: number) => void; notation: 'san' | 'uci'; analysis?: AnalyzedMove[] | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const parts = startFen.split(' ');
  const startNo = Number(parts[5]) || 1;
  const blackFirst = parts[1] === 'b';
  const rows: Array<{ no: number; w?: number; b?: number }> = [];
  moves.forEach((m, i) => {
    const plyFromStart = i + (blackFirst ? 1 : 0);
    const no = startNo + Math.floor(plyFromStart / 2);
    if (m.color === 'w' || rows.length === 0) rows.push({ no });
    const row = rows[rows.length - 1];
    if (m.color === 'w') row.w = i;
    else row.b = i;
  });

  const cell = (i: number | undefined) => {
    if (i == null) return <span className="px-2 py-1 text-ink-faint">…</span>;
    const m = moves[i];
    const a = analysis?.[i];
    const active = cursor === i + 1;
    return (
      <button
        type="button"
        data-active={active}
        onClick={() => onGo(i + 1)}
        title={a && a.classification !== 'best' && a.classification !== 'good' ? `Melhor: ${a.bestSan}` : m.comment || undefined}
        className={cn('flex items-center gap-1.5 rounded px-2 py-1 text-left font-mono text-[13px]', active ? 'bg-accent-soft text-ink' : 'text-ink-muted hover:bg-hover hover:text-ink')}
      >
        {a && CLASS_DOT[a.classification] && <span className={cn('size-1.5 shrink-0 rounded-full', CLASS_DOT[a.classification])} />}
        {notation === 'san' ? m.san : m.uci}
        {m.comment && <span className="size-1 shrink-0 rounded-full bg-brass" aria-label="com comentário" />}
      </button>
    );
  };

  return (
    <div ref={ref} className="max-h-[340px] min-h-[120px] overflow-y-auto rounded-md border border-line bg-sunken p-1">
      {moves.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-ink-faint">Nenhum lance ainda. Mova uma peça no tabuleiro.</p>
      ) : (
        <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-1">
          {rows.map((r) => (
            <div key={r.no} className="contents">
              <span className="px-2 py-1 text-right font-mono text-[12px] text-ink-faint">{r.no}.</span>
              {cell(r.w)}
              {cell(r.b)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
