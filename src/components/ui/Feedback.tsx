import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, label = 'Carregando' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex text-ink-muted', className)}>
      <Loader2 className="size-4 animate-spin" />
    </span>
  );
}

export function LoadingBlock({ label = 'Carregando…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-sm text-ink-muted', className)}>
      <Spinner /> {label}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-hover', className)} />;
}

export function EmptyState({ icon, title, description, action, className, compact }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-6' : 'px-6 py-12', className)}>
      {icon && <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-line bg-sunken text-brass [&_svg]:size-5">{icon}</div>}
      <p className="font-display text-lg text-ink">{title}</p>
      {description && <div className="mt-1 max-w-sm text-sm text-ink-muted">{description}</div>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Alert({ tone = 'info', title, children, action, className }: { tone?: 'info' | 'warning' | 'negative' | 'positive'; title?: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  const tones = {
    info: 'border-info/30 bg-info/5',
    warning: 'border-warning/30 bg-warning/5',
    negative: 'border-negative/30 bg-negative-soft',
    positive: 'border-positive/30 bg-positive-soft',
  };
  const text = { info: 'text-info', warning: 'text-warning', negative: 'text-negative', positive: 'text-positive' };
  return (
    <div role={tone === 'negative' ? 'alert' : 'status'} className={cn('flex items-start justify-between gap-3 rounded-md border px-3.5 py-2.5 text-sm', tones[tone], className)}>
      <div>
        {title && <p className={cn('font-medium', text[tone])}>{title}</p>}
        {children && <div className="text-ink-muted">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className, tone = 'positive' }: { value: number; max?: number; className?: string; tone?: 'positive' | 'accent' }) {
  const p = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)} role="progressbar" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all', tone === 'positive' ? 'bg-positive' : 'bg-brass')} style={{ width: `${p}%` }} />
    </div>
  );
}

export function Ring({ value, size = 104, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--positive)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (p / 100) * c} className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[11px] tracking-wide text-ink-muted uppercase">{label}</div>
      <div className="font-display mt-0.5 text-2xl leading-tight text-ink tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}
