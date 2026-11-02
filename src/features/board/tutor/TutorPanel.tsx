import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookmarkPlus, NotebookPen, RotateCcw, Send, Sparkles } from 'lucide-react';
import { db, type AnalyzedMove, type TutorMessage } from '@/lib/db/schema';
import { askTutor, saveToNotebook } from '@/lib/tutor/service';
import { threadIds, useHasGeminiKey } from '@/lib/tutor/key';
import { geminiErrorMessage } from '@/lib/ai/gemini';
import { engine } from '@/lib/engine/stockfish';
import { getSettings } from '@/lib/settings';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SourceTag } from '@/components/ui/Badge';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Form';
import { toast } from '@/components/ui/Dialog';
import { TutorText } from './TutorText';

type Phase = 'analyzing' | 'consulting';

// Cópia do objeto sem a chave
function without<T>(o: Record<string, T>, key: string): Record<string, T> {
  const next = { ...o };
  delete next[key];
  return next;
}

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
  const [draft, setDraft] = useState('');
  // Pedido em andamento e erro ficam por conversa: ao voltar a uma posição, aparece o estado dela
  const [pending, setPending] = useState<Record<string, Phase>>({});
  const [errors, setErrors] = useState<Record<string, { question: string; message: string }>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false); // um pedido por vez, mesmo com clique duplo

  const busyHere = pending[thread];
  const busyElsewhere = !busyHere && Object.keys(pending).length > 0;
  const error = errors[thread];

  // Rola até a última mensagem
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages?.length, busyHere, thread]);

  const ask = async (question: string, retry = false) => {
    const q = question.trim();
    if (!q || inFlight.current) return;
    inFlight.current = true;
    const t = thread;
    const setPhase = (p: Phase | null) => setPending((s) => (p ? { ...s, [t]: p } : without(s, t)));
    setErrors((s) => without(s, t));
    setPhase('consulting');
    try {
      // Nova tentativa: tira a pergunta que ficou sem resposta para não duplicá-la
      if (retry) {
        const last = (await db.tutorMessages.where('threadId').equals(t).sortBy('createdAt')).at(-1);
        if (last?.role === 'user' && last.text === q) await db.tutorMessages.delete(last.id);
      }
      await askTutor(
        { fen, played, question: q },
        {
          // Mesmo motor do serviço; só marca o estado "Analisando posição…" enquanto o Stockfish roda
          analyze: async (f) => {
            setPhase('analyzing');
            try {
              const { engineDepth } = await getSettings();
              return await engine.analyze(f, { depth: engineDepth, multiPv: 3 });
            } finally {
              setPhase('consulting');
            }
          },
        },
      );
    } catch (e) {
      setErrors((s) => ({ ...s, [t]: { question: q, message: geminiErrorMessage(e) } }));
    } finally {
      inFlight.current = false;
      setPhase(null);
    }
  };

  const submit = () => {
    const q = draft;
    if (!q.trim() || inFlight.current) return;
    setDraft('');
    void ask(q);
  };

  const save = async (msg: TutorMessage) => {
    try {
      const id = await saveToNotebook(msg);
      setSaved((s) => ({ ...s, [msg.id]: id }));
      toast('Explicação salva no Caderno.', 'positive');
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
        description="Cole sua chave do Gemini em Configurações para conversar sobre a posição. O tutor explica a análise do Stockfish em português."
        action={<ButtonLink to="/configuracoes" variant="primary">Abrir Configurações</ButtonLink>}
      />
    );
  }

  const disabled = Object.keys(pending).length > 0;
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
                  {saved[m.id] ? (
                    <ButtonLink size="sm" variant="ghost" to={`/caderno?nota=${saved[m.id]}`}>
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
            <Button size="sm" onClick={() => void ask(error.question, true)} disabled={disabled}>
              <RotateCcw /> Tentar de novo
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}
      <div className="flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <Button key={q} size="sm" onClick={() => void ask(q)} disabled={disabled}>
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
      {busyElsewhere && <p className="text-[11px] text-ink-faint">O tutor ainda está respondendo sobre outra posição.</p>}
    </div>
  );
}
