// Conversas salvas da página Conversa (tabela chatThreads); as mensagens ficam em tutorMessages ('chat:<id>')
import { db } from '@/lib/db/schema'
import { threadIds } from './key'

const TITLE_MAX = 60

// Título a partir da primeira pergunta: uma linha só, cortada numa palavra
export function chatTitle(question: string): string {
  const flat = question.replace(/\s+/g, ' ').trim()
  if (!flat) return 'Nova conversa'
  if (flat.length <= TITLE_MAX) return flat
  const cut = flat.slice(0, TITLE_MAX)
  const space = cut.lastIndexOf(' ')
  return `${(space > TITLE_MAX / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:!?-]+$/, '')}…`
}

/** Cria a conversa na primeira pergunta (título = começo dela); nas seguintes, só atualiza a data. */
export async function touchChat(id: string, question: string, now = Date.now()): Promise<void> {
  await db.transaction('rw', db.chatThreads, async () => {
    const row = await db.chatThreads.get(id)
    if (row) await db.chatThreads.update(id, { updatedAt: now })
    else await db.chatThreads.add({ id, title: chatTitle(question), createdAt: now, updatedAt: now })
  })
}

/** Troca o título; vazio não muda nada (devolve false). */
export async function renameChat(id: string, title: string): Promise<boolean> {
  const value = title.replace(/\s+/g, ' ').trim()
  if (!value) return false
  return (await db.chatThreads.update(id, { title: value })) > 0
}

/** Apaga a conversa e as mensagens dela. */
export async function deleteChat(id: string): Promise<void> {
  await db.transaction('rw', db.chatThreads, db.tutorMessages, async () => {
    await db.tutorMessages.where('threadId').equals(threadIds.chat(id)).delete()
    await db.chatThreads.delete(id)
  })
}
