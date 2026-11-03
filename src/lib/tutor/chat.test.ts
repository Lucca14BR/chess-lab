import { beforeEach, describe, expect, it } from 'vitest'
import { Dexie } from 'dexie'
import { ChessLabDB, STORES_V1, STORES_V2, STORES_V3, db } from '@/lib/db/schema'
import type { TutorMessage } from '@/lib/db/schema'
import { clearAllData, exportBackup, importBackup } from '@/lib/services/backup'
import { chatTitle, deleteChat, renameChat, touchChat } from './chat'
import { threadIds } from './key'

const msg = (id: string, threadId: string): TutorMessage => ({ id, threadId, role: 'user', text: 'oi', segments: null, model: null, fen: null, createdAt: 1 })

beforeEach(async () => {
  await db.chatThreads.clear()
  await db.tutorMessages.clear()
})

describe('chatTitle', () => {
  it('usa o começo da pergunta, sem espaços sobrando', () => {
    expect(chatTitle('  Como   jogar\na Siciliana? ')).toBe('Como jogar a Siciliana?')
  })

  it('corta perguntas longas numa palavra e põe reticências', () => {
    const t = chatTitle('Quero entender os planos típicos das brancas na Defesa Francesa variante do avanço com c3')
    expect(t.length).toBeLessThanOrEqual(61)
    expect(t.endsWith('…')).toBe(true)
    expect(t).toMatch(/^Quero entender os planos típicos/)
    expect(t).not.toMatch(/\s…$/)
  })

  it('vazia vira "Nova conversa"', () => {
    expect(chatTitle('   ')).toBe('Nova conversa')
  })
})

describe('conversas salvas', () => {
  it('touchChat cria a conversa com o título da primeira pergunta e depois só atualiza a data', async () => {
    await touchChat('c1', 'Como treinar finais?', 100)
    expect(await db.chatThreads.get('c1')).toEqual({ id: 'c1', title: 'Como treinar finais?', createdAt: 100, updatedAt: 100 })
    await touchChat('c1', 'Outra pergunta', 200)
    expect(await db.chatThreads.get('c1')).toEqual({ id: 'c1', title: 'Como treinar finais?', createdAt: 100, updatedAt: 200 })
  })

  it('renameChat troca o título; vazio não muda nada', async () => {
    await touchChat('c1', 'Primeira', 1)
    expect(await renameChat('c1', '  Finais de torre  ')).toBe(true)
    expect((await db.chatThreads.get('c1'))?.title).toBe('Finais de torre')
    expect(await renameChat('c1', '   ')).toBe(false)
    expect((await db.chatThreads.get('c1'))?.title).toBe('Finais de torre')
  })

  it('deleteChat apaga a conversa e só as mensagens dela', async () => {
    await touchChat('c1', 'A', 1)
    await touchChat('c2', 'B', 1)
    await db.tutorMessages.bulkPut([msg('m1', threadIds.chat('c1')), msg('m2', threadIds.chat('c1')), msg('m3', threadIds.chat('c2')), msg('m4', 'pos:x')])
    await deleteChat('c1')
    expect(await db.chatThreads.get('c1')).toBeUndefined()
    expect((await db.tutorMessages.toArray()).map((m) => m.id).sort()).toEqual(['m3', 'm4'])
  })

  it('ids das conversas têm o prefixo chat:', () => {
    expect(threadIds.chat('abc')).toBe('chat:abc')
  })
})

describe('backup das conversas', () => {
  it('exporta, importa e apaga junto com os dados', async () => {
    await touchChat('c1', 'Plano?', 1)
    await db.tutorMessages.put(msg('m1', threadIds.chat('c1')))
    const json = await exportBackup()
    expect(JSON.parse(json).tables.chatThreads).toHaveLength(1)

    await clearAllData()
    expect(await db.chatThreads.count()).toBe(0)
    expect(await db.tutorMessages.count()).toBe(0)

    await importBackup(json)
    expect((await db.chatThreads.get('c1'))?.title).toBe('Plano?')
    expect(await db.tutorMessages.count()).toBe(1)
  })
})

describe('upgrade do banco v3 → v4', () => {
  it('mantém os dados e cria chatThreads', async () => {
    const name = 'upgrade-v3-v4'
    const old = new Dexie(name)
    old.version(1).stores(STORES_V1)
    old.version(2).stores(STORES_V2)
    old.version(3).stores(STORES_V3)
    await old.open()
    await old.table('tutorMessages').put({ id: 'm1', threadId: 't', createdAt: 1 })
    await old.table('musicTracks').put({ id: 't1', addedAt: 1 })
    old.close()

    const next = new ChessLabDB(name)
    await next.open()
    expect(next.verno).toBe(4)
    expect(await next.tutorMessages.count()).toBe(1)
    expect(await next.musicTracks.count()).toBe(1)
    expect(await next.chatThreads.count()).toBe(0)
    next.close()
  })
})
