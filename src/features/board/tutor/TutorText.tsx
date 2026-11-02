import { Fragment } from 'react';
import type { Segment } from '@/lib/tutor/types';
import { Badge } from '@/components/ui/Badge';

type MoveSegment = Extract<Segment, { kind: 'move' }>;

/** Texto do tutor: lances conferidos viram botões; lances não conferidos ganham aviso. */
export function TutorText({ segments, onMove }: { segments: Segment[]; onMove?: (s: MoveSegment) => void }) {
  return (
    <p className="text-xs leading-relaxed whitespace-pre-line text-ink">
      {segments.map((s, i) => {
        if (s.kind === 'text') return <Fragment key={i}>{s.text}</Fragment>;
        if (s.kind === 'unverified') {
          return (
            <span key={i}>
              {s.text}{' '}
              <Badge tone="warning" title="O lance citado não está na análise do motor ou não é legal na posição">
                não confirmado pelo motor
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
