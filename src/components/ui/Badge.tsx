import type { ReactNode } from 'react';
import { Cloud, Calculator, PencilLine, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'accent';

const tones: Record<Tone, string> = {
  neutral: 'bg-hover text-ink-muted border-line',
  positive: 'bg-positive-soft text-positive border-positive/25',
  negative: 'bg-negative-soft text-negative border-negative/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  info: 'bg-info/10 text-info border-info/25',
  accent: 'bg-accent-soft text-brass border-brass/25',
};

export function Badge({ children, tone = 'neutral', className, title }: { children: ReactNode; tone?: Tone; className?: string; title?: string }) {
  return (
    <span title={title} className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] leading-none font-medium whitespace-nowrap [&_svg]:size-3', tones[tone], className)}>
      {children}
    </span>
  );
}

export type DataSource = 'api' | 'calc' | 'manual' | 'ai';

const SOURCE: Record<DataSource, { label: string; title: string; icon: ReactNode }> = {
  api: { label: 'Chess.com', title: 'Dado fornecido diretamente pela API pública do Chess.com', icon: <Cloud /> },
  calc: { label: 'Calculado', title: 'Calculado pelo Chess Lab a partir dos dados disponíveis', icon: <Calculator /> },
  manual: { label: 'Manual', title: 'Registrado por você no Chess Lab', icon: <PencilLine /> },
  ai: { label: 'IA', title: 'Explicação gerada por IA a partir da análise do motor', icon: <Sparkles /> },
};

/** Indica a origem do dado: API, cálculo do Chess Lab, registro manual ou IA. */
export function SourceTag({ source, className }: { source: DataSource; className?: string }) {
  const s = SOURCE[source];
  return (
    <span title={s.title} className={cn('inline-flex items-center gap-1 text-[10.5px] tracking-wide text-ink-faint uppercase [&_svg]:size-3', className)}>
      {s.icon}
      {s.label}
    </span>
  );
}
