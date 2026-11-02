import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db/schema'
import { clearAllData, exportBackup, importBackup } from '@/lib/services/backup'
import { getGeminiKey, removeGeminiKey, setGeminiKey, threadIds } from './key'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

beforeEach(async () => {
  await db.secrets.clear()
  await db.tutorMessages.clear()
})

describe('chave do Gemini', () => {
  it('setGeminiKey remove espaços e quebras', async () => {
    await setGeminiKey('  AIza-x \n')
    expect(await getGeminiKey()).toBe('AIza-x')
    await setGeminiKey('   ')
    expect(await getGeminiKey()).toBeNull()
  })

  it('removeGeminiKey apaga a chave', async () => {
    await setGeminiKey('abc')
    await removeGeminiKey()
    expect(await getGeminiKey()).toBeNull()
  })
})

describe('backup e a chave', () => {
  const msg = { id: 'm1', threadId: 'pos:x', role: 'user' as const, text: 'oi', segments: null, model: null, fen: START, createdAt: 1 }

  it('backup não exporta a chave', async () => {
    await setGeminiKey('S3CRETO')
    await db.tutorMessages.put(msg)
    const json = await exportBackup()
    expect(json).not.toContain('S3CRETO')
    expect(JSON.parse(json).tables).toHaveProperty('tutorMessages')
    expect(JSON.parse(json).tables).not.toHaveProperty('secrets')
  })

  it('importBackup preserva a chave', async () => {
    await setGeminiKey('S3CRETO')
    const json = await exportBackup()
    await importBackup(json)
    expect(await getGeminiKey()).toBe('S3CRETO')
  })

  it('importBackup restaura as mensagens do tutor', async () => {
    await db.tutorMessages.put(msg)
    const json = await exportBackup()
    await db.tutorMessages.clear()
    await importBackup(json)
    expect(await db.tutorMessages.count()).toBe(1)
  })

  it('clearAllData apaga a chave', async () => {
    await setGeminiKey('S3CRETO')
    await db.tutorMessages.put(msg)
    await clearAllData()
    expect(await getGeminiKey()).toBeNull()
    expect(await db.tutorMessages.count()).toBe(0)
  })
})

describe('threadIds', () => {
  it('review usa o id da análise', () => {
    expect(threadIds.review('chesscom:1')).toBe('review:chesscom:1')
  })

  it('position ignora os relógios do FEN', () => {
    const a = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    const b = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 5 9'
    expect(threadIds.position(a)).toBe(threadIds.position(b))
    expect(threadIds.position(a)).toMatch(/^pos:/)
    expect(threadIds.position(a)).not.toBe(threadIds.position(START))
  })
})
