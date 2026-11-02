import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const field =
  'w-full rounded-md border border-line bg-sunken px-3 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong focus:border-brass focus:outline-none disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(field, 'h-9', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(field, 'min-h-24 py-2 leading-relaxed', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(field, 'h-9 cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
});

export function Field({ label, hint, error, children, htmlFor, className }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-ink-muted uppercase">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-negative" role="alert">{error}</p> : hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-muted">{description}</span>}
      </label>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-5 w-9 shrink-0 rounded-full border transition-colors', checked ? 'border-positive/50 bg-positive/40' : 'border-line-strong bg-sunken')}
      >
        <span className={cn('absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ivory transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, size = 'md', className, ariaLabel }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: ReactNode }>; size?: 'sm' | 'md'; className?: string; ariaLabel?: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex rounded-md border border-line bg-sunken p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded px-2.5 whitespace-nowrap transition-colors',
            size === 'sm' ? 'h-6 text-xs' : 'h-7 text-[13px]',
            value === o.value ? 'bg-panel-2 text-ink shadow-[inset_0_0_0_1px_var(--border-strong)]' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Controle deslizante para valores de 0 a 1 (mostrado em %). Responde na hora na tela
 * e só avisa `onChange` depois de uma pausa curta, para não gravar a cada pixel arrastado.
 */
export function Range({ id, label, value, onChange, disabled, className }: { id: string; label: string; value: number; onChange: (v: number) => void; disabled?: boolean; className?: string }) {
  const [local, setLocal] = useState(value);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (timer.current === null) setLocal(value);
  }, [value]);
  useEffect(() => () => void (timer.current !== null && clearTimeout(timer.current)), []);
  const change = (v: number) => {
    setLocal(v);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      onChange(v);
    }, 120);
  };
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={id} className="text-ink-muted">
          {label}
        </label>
        <span className="text-ink-faint tabular-nums">{Math.round(local * 100)}%</span>
      </div>
      <input id={id} type="range" min={0} max={100} step={1} value={Math.round(local * 100)} disabled={disabled} onChange={(e) => change(Number(e.target.value) / 100)} className="block w-full cursor-pointer accent-[var(--brass)] disabled:cursor-default disabled:opacity-50" />
    </div>
  );
}
