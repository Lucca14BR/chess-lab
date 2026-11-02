import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookmarkPlus, NotebookPen, RotateCcw, Send, Sparkles } from 'lucide-react';
import { db, type AnalyzedMove, type TutorMessage } from '@/lib/db/schema';
import { threadIds, useHasGeminiKey } from '@/lib/tutor/key';
import { useStore } from '@/lib/store';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SourceTag } from '@/components/ui/Badge';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Form';
import { toast } from '@/components/ui/Dialog';
import { TutorText } from './TutorText';
import { askInPosition, saveReply, tutorStore } from './tutorState';

const QUICK = {
  plan: 'Qual é o plano aqui?',
  played: 'Por que meu lance foi ruim?',
  threats: 'Quais são as ameaças?',
};

/** Conversa com o tutor sobre a posição atual (uma conversa por posição). */
export function TutorPanel({ fen, played, onShowMove }: { fen: string; played: AnalyzedMove | null; onShowMove: (uci: string) => void }) {
  const hasKey = useHasGeminiKey();
  const thread = threadIds.position(fen);
  const messages = useLiveQuery(() => db.tutorMessages.where('threadId').equals(thread).sortBy('createdAt'), [thread]);
  // Pedido, erro e notas salvas vêm do store: continuam certos ao trocar de aba ou de posição
  const { pending, errors, notes } = useStore(tutorStore);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const busyHere = pending[thread];
  const disabled = Object.keys(pending).length > 0;
  const busyElsewhere = !busyHere && disabled;
  const error = errors[thread];

  // Rola até a última mensagem
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages?.length, busyHere, thread]);

  const ask = (question: string, retry = false) => void askInPosition({ fen, played, question }, retry);

  const submit = () => {
    if (!draft.trim() || disabled) return;
    ask(draft);
    setDraft('');
  };

  const save = async (msg: TutorMessage) => {
    try {
      if (await saveReply(msg)) toast('Explicação salva no Caderno.', 'positive');
    } catch {
      toast('Não foi possível salvar no Caderno.', 'negative');
    }
  };

  if (hasKey === undefined) return <Spinner />;
  if (!hasKey) {
    return (
      <EmptyState
        compact
        icon={<Sparkles />}
        title="Tutor de IA desativado"
        description="Cole sua chave do Gemini em Configurações e converse com o seu tutor sobre a posição. Ele explica a análise do Stockfish em português."
        action={<ButtonLink to="/configuracoes" variant="primary">Abrir Configurações</ButtonLink>}
      />
    );
  }

  const quick = [QUICK.plan, ...(played ? [QUICK.played] : []), QUICK.threats];

  return (
    <div className="space-y-3">
      <div ref={listRef} className="max-h-96 space-y-2 overflow-y-auto">
        {!messages?.length && !busyHere && <p className="text-xs text-ink-faint">Pergunte sobre a posição do tabuleiro. O tutor parte da análise do Stockfish e marca os lances que o motor não confirmou.</p>}
        {messages?.map((m) =>
          m.role === 'user' ? (
            <p key={m.id} className="ml-8 rounded-md bg-hover px-2.5 py-1.5 text-xs text-ink">
              {m.text}
            </p>
          ) : (
            <div key={m.id} className="rounded-md border border-line bg-sunken px-2.5 py-2">
              <TutorText segments={m.segments ?? [{ kind: 'text', text: m.text }]} onMove={(s) => onShowMove(s.uci)} />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SourceTag source="ai" />
                {m.model && <span className="font-mono text-[10.5px] text-ink-faint">{m.model}</span>}
                <span className="ml-auto">
                  {notes[m.id] ? (
                    <ButtonLink size="sm" variant="ghost" to={`/caderno?nota=${notes[m.id]}`}>
                      <NotebookPen /> Abrir nota
                    </ButtonLink>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => void save(m)}>
                      <BookmarkPlus /> Salvar no Caderno
                    </Button>
                  )}
                </span>
              </div>
            </div>
          ),
        )}
        {busyHere && (
          <p className="flex items-center gap-2 text-xs text-ink-muted">
            <Spinner /> {busyHere === 'analyzing' ? 'Analisando posição…' : 'Consultando o tutor…'}
          </p>
        )}
      </div>
      {error && (
        <Alert
          tone="negative"
          action={
            <Button size="sm" onClick={() => ask(error.question, true)} disabled={disabled}>
              <RotateCcw /> Tentar de novo
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}
      <div className="flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <Button key={q} size="sm" onClick={() => ask(q)} disabled={disabled}>
            {q}
          </Button>
        ))}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Pergunte sobre esta posição… (ex.: e se eu jogar Cf3?)"
          aria-label="Pergunta ao tutor"
          className="min-h-16 text-xs"
        />
        <Button type="submit" variant="primary" size="icon" disabled={disabled || !draft.trim()} aria-label="Enviar pergunta" title="Enviar (Enter)">
          <Send />
        </Button>
      </form>
      {busyElsewhere && <p className="text-[11px] text-ink-faint">O tutor ainda está respondendo a outro pedido.</p>}
    </div>
  );
}
