import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, List, Pencil, RotateCcw, Send, Sparkles, SquarePen, Trash2 } from 'lucide-react';
import { db, type ChatThread, type TutorMessage } from '@/lib/db/schema';
import { threadIds, useHasGeminiKey } from '@/lib/tutor/key';
import type { Segment } from '@/lib/tutor/types';
import { useStore } from '@/lib/store';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Form';
import { toast } from '@/components/ui/Dialog';
import { askInChat, saveReply, tutorStore } from '@/features/board/tutor/tutorState';
import { chatUi, newChat, selectChat, setAttach } from './chatUi';
import { TutorReply, UserMessage } from './ChatMessage';
import { RenameChatDialog, ThreadList } from './ChatThreads';
import { confirmDeleteChat } from './confirmDelete';
import { fenSummary } from './position';

type MoveSegment = Extract<Segment, { kind: 'move' }>;

const SUGGESTIONS = ['Qual é o plano nesta posição?', 'Como devo treinar finais?', 'Quais aberturas combinam com quem está começando?'];

/** Conversa com o tutor: várias conversas salvas, a posição do tabuleiro vai junto (opcional). */
export function ChatPanel({ fen, onShowMove, onLoadFen }: { fen: string; onShowMove: (s: MoveSegment) => void; onLoadFen: (fen: string) => void }) {
  const hasKey = useHasGeminiKey();
  const threads = useLiveQuery(() => db.chatThreads.orderBy('updatedAt').reverse().toArray(), []);
  const { selected, attach } = useStore(chatUi);
  const { pending, errors, notes } = useStore(tutorStore);
  const chatId = selected ?? threads?.[0]?.id ?? null; // null = conversa nova, ainda sem id
  const thread = threads?.find((t) => t.id === chatId) ?? null;
  const key = chatId ? threadIds.chat(chatId) : '';
  const messages = useLiveQuery(() => (key ? db.tutorMessages.where('threadId').equals(key).sortBy('createdAt') : []), [key]);
  const [view, setView] = useState<'chat' | 'list'>('chat');
  const [draft, setDraft] = useState('');
  const [renaming, setRenaming] = useState<ChatThread | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const busyHere = key ? pending[key] : undefined;
  const disabled = Object.keys(pending).length > 0; // um pedido por vez no app todo
  const busyElsewhere = !busyHere && disabled;
  const error = key ? errors[key] : undefined;

  // Rola até a última mensagem
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages?.length, busyHere, key, view]);

  const ask = (question: string, retry = false) => {
    if (disabled || !question.trim()) return;
    const id = chatId ?? newChat();
    if (!selected) selectChat(id); // fixa a conversa: a lista pode reordenar enquanto a resposta chega
    void askInChat({ chatId: id, fen: attach ? fen : null, question }, retry);
  };

  const submit = () => {
    if (!draft.trim() || disabled) return;
    ask(draft);
    setDraft('');
  };

  const save = async (msg: TutorMessage) => {
    try {
      if (await saveReply(msg)) toast('Resposta salva no Caderno.', 'positive');
    } catch {
      toast('Não foi possível salvar no Caderno.', 'negative');
    }
  };

  const startNew = () => {
    newChat();
    setView('chat');
    setDraft('');
  };

  if (hasKey === undefined) return <Spinner />;
  if (!hasKey) {
    return (
      <EmptyState
        icon={<Sparkles />}
        title="Tutor de IA desativado"
        description="Cole sua chave do Gemini em Configurações e converse com o seu tutor sobre xadrez e sobre a posição do tabuleiro. Ele explica a análise do Stockfish em português."
        action={<ButtonLink to="/configuracoes" variant="primary">Abrir Configurações</ButtonLink>}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-line pb-3">
        {view === 'list' ? (
          <>
            <Button size="icon-sm" variant="ghost" onClick={() => setView('chat')} aria-label="Voltar à conversa" title="Voltar à conversa">
              <ArrowLeft />
            </Button>
            <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-ink">Conversas salvas</h2>
          </>
        ) : (
          <>
            <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-ink" title={thread?.title}>
              {thread?.title ?? 'Nova conversa'}
            </h2>
            {thread && (
              <>
                <Button size="icon-sm" variant="ghost" onClick={() => setRenaming(thread)} aria-label="Renomear conversa" title="Renomear">
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={!!busyHere}
                  aria-label="Apagar conversa"
                  title={busyHere ? 'Espere a resposta terminar' : 'Apagar'}
                  onClick={async () => {
                    if (await confirmDeleteChat(thread)) selectChat(null);
                  }}
                >
                  <Trash2 />
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setView('list')} title="Conversas salvas">
              <List /> Conversas{threads?.length ? ` (${threads.length})` : ''}
            </Button>
          </>
        )}
        <Button size="sm" onClick={startNew} disabled={view === 'chat' && !thread} title="Começar uma conversa nova">
          <SquarePen /> Nova
        </Button>
      </div>

      {view === 'list' ? (
        <div className="min-h-0 flex-1 overflow-y-auto pt-3">
          <ThreadList
            threads={threads ?? []}
            current={chatId}
            busy={(id) => !!pending[threadIds.chat(id)]}
            onOpen={(id) => {
              selectChat(id);
              setView('chat');
            }}
            onRename={setRenaming}
            onDeleted={(id) => id === chatId && selectChat(null)}
          />
        </div>
      ) : (
        <>
          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto py-3" aria-live="polite">
            {!messages?.length && !busyHere && (
              <div className="space-y-3 px-1 pt-2">
                <p className="text-sm text-ink-muted">Pergunte o que quiser sobre xadrez: a posição do tabuleiro, aberturas, planos ou como treinar. Com a posição anexada, o tutor parte da análise do Stockfish e os lances conferidos viram setas no tabuleiro.</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((q) => (
                    <Button key={q} size="sm" onClick={() => ask(q)} disabled={disabled}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages?.map((m) =>
              m.role === 'user' ? (
                <UserMessage key={m.id} msg={m} onLoadFen={onLoadFen} />
              ) : (
                <TutorReply key={m.id} msg={m} noteId={notes[m.id]} onMove={onShowMove} onSave={() => void save(m)} />
              ),
            )}
            {busyHere && (
              <p className="flex items-center gap-2 text-xs text-ink-muted">
                <Spinner /> {busyHere === 'analyzing' ? 'Analisando a posição…' : 'Consultando o tutor…'}
              </p>
            )}
          </div>
          {error && (
            <Alert
              tone="negative"
              className="mb-2"
              action={
                <Button size="sm" onClick={() => ask(error.question, true)} disabled={disabled}>
                  <RotateCcw /> Tentar de novo
                </Button>
              }
            >
              {error.message}
            </Alert>
          )}
          <form
            className="space-y-2 border-t border-line pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter envia; Shift+Enter quebra a linha; durante a composição (IME) o Enter é do teclado
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Pergunte ao tutor… (Enter envia, Shift+Enter quebra a linha)"
                aria-label="Mensagem para o tutor"
                className="min-h-16 text-sm"
              />
              <Button type="submit" variant="primary" size="icon" disabled={disabled || !draft.trim()} aria-label="Enviar mensagem" title="Enviar (Enter)">
                <Send />
              </Button>
            </div>
            <label className="flex min-w-0 items-center gap-1.5 text-xs text-ink-muted">
              <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="accent-[var(--brass)]" />
              <span className="shrink-0">Anexar a posição do tabuleiro</span>
              {attach && (
                <span className="truncate font-mono text-[10.5px] text-ink-faint" title={fen}>
                  · {fenSummary(fen)}
                </span>
              )}
            </label>
            {busyElsewhere && <p className="text-[11px] text-ink-faint">O tutor ainda está respondendo a outro pedido.</p>}
          </form>
        </>
      )}
      <RenameChatDialog key={renaming?.id ?? ''} thread={renaming} onClose={() => setRenaming(null)} />
    </div>
  );
}
