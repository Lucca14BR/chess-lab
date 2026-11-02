import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-brass uppercase">{eyebrow}</p>}
        <h1 className="font-display text-[34px] leading-none text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8', className)}>{children}</div>;
}

export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: Array<{ value: T; label: ReactNode; count?: number }>; className?: string }) {
  return (
    <div role="tablist" className={cn('mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line [scrollbar-width:none]', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            '-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
            value === t.value ? 'border-brass text-ink' : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 text-xs text-ink-faint tabular-nums">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
