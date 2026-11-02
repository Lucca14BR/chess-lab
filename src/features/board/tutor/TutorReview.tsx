import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MessageCircleQuestion, RotateCcw, Sparkles } from 'lucide-react';
import { db, type GameAnalysis } from '@/lib/db/schema';
import { threadIds, useHasGeminiKey } from '@/lib/tutor/key';
import { useStore } from '@/lib/store';
import { MOVE_CLASS_LABEL } from '@/lib/engine/gameAnalysis';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SourceTag } from '@/components/ui/Badge';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { Segmented } from '@/components/ui/Form';
import { cn } from '@/lib/utils';
import { TutorText } from './TutorText';
import { reviewGame, tutorStore } from './tutorState';

type Color = 'white' | 'black';

const CLASS_TONE = { blunder: 'text-negative', mistake: 'text-[#d38b4a]', inaccuracy: 'text-warning', good: 'text-ink-muted', best: 'text-positive' } as const;

/** Revisão do tutor: momentos decisivos da partida analisada, explicados pela IA. */
export function TutorReview({ analysis, userColor, onGo, onAsk }: { analysis: GameAnalysis; userColor: Color | undefined; onGo: (cursor: number) => void; onAsk: (cursor: number) => void }) {
  const hasKey = useHasGeminiKey();
  const thread = threadIds.review(analysis.id);
  const review = useLiveQuery(() => db.tutorMessages.where('threadId').equals(thread).first(), [thread]);
  // null = o usuário ainda não escolheu: vale a cor da revisão salva
  const [pick, setPick] = useState<Color | null>(null);
  // Pedido e erro vêm do store, pela conversa desta análise: sobrevivem à troca de aba
  const { pending, errors } = useStore(tutorStore);
  const data = review?.review;
  const color = userColor ?? pick ?? data?.userColor ?? 'white';
  const running = !!pending[thread];
  const disabled = Object.keys(pending).length > 0; // um pedido por vez no app
  const error = errors[thread];

  const run = () => void reviewGame(analysis, color);

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-xs tracking-wide text-ink-muted uppercase">Revisão do tutor</p>
        {hasKey && !userColor && (
          <Segmented size="sm" value={color} onChange={setPick} ariaLabel="Cor revisada" options={[{ value: 'white', label: 'Revisar como Brancas' }, { value: 'black', label: 'Revisar como Pretas' }]} />
        )}
        {hasKey && (
          <Button size="sm" variant={data ? 'secondary' : 'primary'} onClick={run} disabled={disabled}>
            {running ? <Spinner /> : data ? <RotateCcw /> : <Sparkles />} {data ? 'Gerar de novo' : 'Revisão do tutor'}
          </Button>
        )}
      </div>
      {hasKey === false && (
        <p className="text-xs text-ink-faint">
          Ative o tutor de IA com sua chave do Gemini para receber a explicação dos momentos decisivos.{' '}
          <ButtonLink size="sm" variant="ghost" to="/configuracoes">
            Abrir Configurações
          </ButtonLink>
        </p>
      )}
      {running && <p className="text-xs text-ink-muted">Consultando o tutor… a revisão analisa cada momento com o Stockfish antes.</p>}
      {error && (
        <Alert
          tone="negative"
          action={
            <Button size="sm" onClick={run} disabled={disabled}>
              <RotateCcw /> Tentar de novo
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}
      {data && (
        <>
          {data.clean && <Alert tone="positive" title="Partida sem erros graves">Nenhum lance seu perdeu muita chance de vitória. Os momentos abaixo são as maiores viradas da partida.</Alert>}
          <ul className="space-y-2">
            {data.moments.map((mo) => {
              const m = analysis.moves.find((x) => x.ply === mo.ply);
              return (
                <li key={mo.ply} className="rounded-md border border-line bg-sunken px-2.5 py-2">
                  <button type="button" onClick={() => onGo(mo.ply)} className="w-full text-left text-xs hover:text-ink" title="Levar o tabuleiro a este momento">
                    <span className="font-mono text-ink">
                      Lance {Math.ceil(mo.ply / 2)}
                      {m?.color === 'black' ? '...' : '.'} {m?.san}
                    </span>
                    {m && <span className={cn('ml-2 font-medium', CLASS_TONE[m.classification])}>{MOVE_CLASS_LABEL[m.classification]}</span>}
                    <span className="mt-0.5 block font-medium text-ink">{mo.title}</span>
                  </button>
                  <div className="mt-1 space-y-1.5">
                    <TutorText segments={mo.explanation} />
                    {mo.whatToConsider.length > 0 && (
                      <div>
                        <p className="text-[11px] text-ink-muted">O que considerar</p>
                        <TutorText segments={mo.whatToConsider} />
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="mt-1" onClick={() => onAsk(mo.ply)}>
                    <MessageCircleQuestion /> Perguntar sobre este momento
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="rounded-md border border-line bg-sunken px-2.5 py-2">
            <p className="mb-1 text-[11px] text-ink-muted">Resumo {data.userColor === 'white' ? 'das Brancas' : 'das Pretas'}</p>
            <TutorText segments={data.summary} />
          </div>
          <p className="flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
            <SourceTag source="ai" />
            {review?.model && <span className="font-mono">{review.model}</span>}
          </p>
        </>
      )}
    </div>
  );
}
