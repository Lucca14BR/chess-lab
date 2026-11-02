import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import type { ReactNode } from 'react';
import { formatDate, formatShortDate, pct } from '@/lib/utils';
import type { RatingPoint, WDL } from '@/lib/stats/games';

export const AXIS = { stroke: 'var(--text-faint)', fontSize: 11, tickLine: false, axisLine: false } as const;

export function TooltipBox({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line-strong bg-panel px-3 py-2 text-xs shadow-xl">
      {title && <div className="mb-1 text-ink-muted">{title}</div>}
      <div className="space-y-0.5 text-ink">{children}</div>
    </div>
  );
}

function RatingTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as RatingPoint;
  return (
    <TooltipBox title={formatDate(p.t)}>
      <span className="font-display text-base">{p.rating}</span> <span className="text-ink-muted">rating</span>
    </TooltipBox>
  );
}

export function RatingAreaChart({ data, height = 150, compact = false }: { data: RatingPoint[]; height?: number; compact?: boolean }) {
  const min = Math.min(...data.map((d) => d.rating));
  const max = Math.max(...data.map((d) => d.rating));
  const pad = Math.max(10, Math.round((max - min) * 0.15));
  const gid = `rating-fill-${compact ? 'c' : 'f'}`;
  return (
    <AreaChart responsive style={{ width: '100%', height }} data={data} margin={{ top: 6, right: compact ? 4 : 12, bottom: 0, left: compact ? 4 : 0 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--positive)" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {!compact && <CartesianGrid stroke="var(--chart-grid)" vertical={false} />}
      <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} hide={compact} tickFormatter={(t) => formatShortDate(t)} {...AXIS} minTickGap={40} />
      <YAxis domain={[min - pad, max + pad]} hide={compact} width={42} {...AXIS} allowDecimals={false} />
      <Tooltip content={RatingTooltip} cursor={{ stroke: 'var(--border-strong)' }} />
      <Area type="monotone" dataKey="rating" stroke="var(--positive)" strokeWidth={2} fill={`url(#${gid})`} dot={false} activeDot={{ r: 4, fill: 'var(--positive)', stroke: 'var(--bg-panel)' }} isAnimationActive={false} />
    </AreaChart>
  );
}

/** Barra horizontal empilhada V/E/D. */
export function WdlBar({ w, className }: { w: WDL; className?: string }) {
  if (!w.total) return <div className={`h-2 rounded-full bg-sunken ${className ?? ''}`} />;
  return (
    <div className={`flex h-2 overflow-hidden rounded-full bg-sunken ${className ?? ''}`} title={`V ${w.win} · E ${w.draw} · D ${w.loss}`}>
      <div className="bg-positive" style={{ width: `${(w.win / w.total) * 100}%` }} />
      <div className="bg-ink-faint" style={{ width: `${(w.draw / w.total) * 100}%` }} />
      <div className="bg-negative" style={{ width: `${(w.loss / w.total) * 100}%` }} />
    </div>
  );
}

export function WdlLegend({ win, draw, loss }: { win: number; draw: number; loss: number }) {
  const total = win + draw + loss;
  const items = [
    { label: 'Vitórias', n: win, color: 'bg-positive' },
    { label: 'Empates', n: draw, color: 'bg-ink-faint' },
    { label: 'Derrotas', n: loss, color: 'bg-negative' },
  ];
  return (
    <div className="grid grid-cols-3 divide-x divide-line">
      {items.map((i) => (
        <div key={i.label} className="px-3 text-center first:pl-0 last:pr-0">
          <div className="font-display text-2xl leading-tight text-ink tabular-nums">{pct(i.n, total)}%</div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <span className={`size-1.5 rounded-full ${i.color}`} />
            {i.label}
          </div>
          <div className="text-[11px] text-ink-faint tabular-nums">{i.n}</div>
        </div>
      ))}
    </div>
  );
}
