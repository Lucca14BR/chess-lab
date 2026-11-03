import { Fragment } from 'react';
import type { Segment } from '@/lib/tutor/types';
import { plainSegments } from '@/lib/tutor/verify';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type MoveSegment = Extract<Segment, { kind: 'move' }>;

/** Aviso dos lances não conferidos (a página Conversa usa um texto próprio). */
export interface UnverifiedNotice {
  label: string;
  title: string;
}

const DEFAULT_NOTICE: UnverifiedNotice = { label: 'não confirmado pelo motor', title: 'O lance citado não está na análise do motor ou não é legal na posição' };

/** Texto do tutor: lances conferidos viram botões; lances não conferidos ganham aviso. Markdown que sobrou sai na exibição. */
export function TutorText({ segments, onMove, notice = DEFAULT_NOTICE, className }: { segments: Segment[]; onMove?: (s: MoveSegment) => void; notice?: UnverifiedNotice; className?: string }) {
  return (
    <p className={cn('leading-relaxed whitespace-pre-line text-ink', className ?? 'text-xs')}>
      {plainSegments(segments).map((s, i) => {
        if (s.kind === 'text') return <Fragment key={i}>{s.text}</Fragment>;
        if (s.kind === 'unverified') {
          return (
            <span key={i}>
              {s.text}{' '}
              <Badge tone="warning" title={notice.title}>
                {notice.label}
              </Badge>
            </span>
          );
        }
        if (!onMove) return <span key={i} className="font-mono text-positive">{s.text}</span>;
        return (
          <button key={i} type="button" onClick={() => onMove(s)} className="font-mono text-positive underline decoration-dotted underline-offset-2 hover:decoration-solid" title={`Mostrar ${s.san} no tabuleiro`}>
            {s.text}
          </button>
        );
      })}
    </p>
  );
}
