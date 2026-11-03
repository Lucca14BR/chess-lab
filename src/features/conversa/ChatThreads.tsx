import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ChatThread } from '@/lib/db/schema';
import { renameChat } from '@/lib/tutor/chat';
import { cn, formatRelative } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Form';
import { confirmDeleteChat } from './confirmDelete';

/** Lista das conversas salvas (mais recentes primeiro). */
export function ThreadList({ threads, current, busy, onOpen, onRename, onDeleted }: { threads: ChatThread[]; current: string | null; busy: (id: string) => boolean; onOpen: (id: string) => void; onRename: (t: ChatThread) => void; onDeleted: (id: string) => void }) {
  if (!threads.length) return <EmptyState compact title="Nenhuma conversa salva" description="Suas conversas aparecem aqui depois da primeira pergunta." />;
  return (
    <ul className="space-y-1">
      {threads.map((t) => (
        <li key={t.id} className={cn('flex items-center gap-1 rounded-md border bg-sunken px-2 py-1.5', t.id === current ? 'border-brass/60' : 'border-line')}>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(t.id)} aria-current={t.id === current ? 'true' : undefined}>
            <span className="block truncate text-sm text-ink">{t.title}</span>
            <span className="block text-[11px] text-ink-faint">{formatRelative(t.updatedAt)}</span>
          </button>
          <Button size="icon-sm" variant="ghost" aria-label={`Renomear “${t.title}”`} title="Renomear" onClick={() => onRename(t)}>
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Apagar “${t.title}”`}
            title={busy(t.id) ? 'Espere a resposta terminar' : 'Apagar'}
            disabled={busy(t.id)}
            onClick={async () => {
              if (await confirmDeleteChat(t)) onDeleted(t.id);
            }}
          >
            <Trash2 />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Renomear uma conversa (use key={thread.id} para reiniciar o campo a cada conversa). */
export function RenameChatDialog({ thread, onClose }: { thread: ChatThread | null; onClose: () => void }) {
  const [title, setTitle] = useState(thread?.title ?? '');
  const save = async () => {
    if (!thread) return;
    if (await renameChat(thread.id, title)) onClose();
  };
  return (
    <Dialog
      open={!!thread}
      onClose={onClose}
      title="Renomear conversa"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={!title.trim()}>
            Salvar
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label="Título" htmlFor="chat-title">
          <Input id="chat-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Finais de torre" autoFocus maxLength={120} />
        </Field>
      </form>
    </Dialog>
  );
}
