import type { ChatThread } from '@/lib/db/schema';
import { deleteChat } from '@/lib/tutor/chat';
import { confirm, toast } from '@/components/ui/Dialog';

/** Pergunta antes de apagar a conversa (e as mensagens dela); devolve true se apagou. */
export async function confirmDeleteChat(thread: ChatThread): Promise<boolean> {
  const ok = await confirm({ title: 'Apagar conversa?', message: `“${thread.title}” e todas as mensagens dela serão apagadas.`, confirmLabel: 'Apagar', danger: true });
  if (!ok) return false;
  await deleteChat(thread.id);
  toast('Conversa apagada.', 'info');
  return true;
}
