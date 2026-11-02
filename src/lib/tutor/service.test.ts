import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Chess } from 'chess.js'
import { START_FEN as START } from '@/lib/chess/board'
import { GeminiError } from '@/lib/ai/gemini'
import { db } from '@/lib/db/schema'
import type { AnalyzedMove, GameAnalysis } from '@/lib/db/schema'
import type { AnalysisResult } from '@/lib/engine/stockfish'
import { threadIds } from './key'
import { askTutor, clearTutorCache, generateReview, saveToNotebook } from './service'
import type { TutorDeps } from './service'

const FEN_B = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

function afterNf3(): string {
  const c = new Chess(START)
  c.move('Nf3')
  return c.fen()
}

const analysisFor = (fen: string, pv: string[]): AnalysisResult => ({
  fen,
  depth: 10,
  bestMove: pv[0] ?? null,
  lines: [{ multipv: 1, depth: 10, cp: 20, mate: null, pv }],
})

function makeDeps(over: Partial<TutorDeps> = {}) {
  const analyze = vi.fn(async (fen: string) => analysisFor(fen, fen === START ? ['e2e4', 'e7e5'] : ['e7e5']))
  const generate = vi.fn(async (_req: unknown) => ({ text: 'Boa pergunta.', model: 'models/teste' }))
  const level = vi.fn(async () => 'intermediario' as const)
  const deps: TutorDeps = { analyze, generate, level, ...over }
  return { deps, analyze, generate }
}

beforeEach(async () => {
  await db.tutorMessages.clear()
  await db.notes.clear()
  await db.activity.clear()
  clearTutorCache()
})

describe('askTutor', () => {
  it('grava no threadId da posição perguntada', async () => {
    const { deps } = makeDeps()
    const reply = await askTutor({ fen: START, played: null, question: 'O que fazer?' }, deps)
    const rows = await db.tutorMessages.where('threadId').equals(threadIds.position(START)).sortBy('createdAt')
    expect(rows.map((r) => r.role)).toEqual(['user', 'tutor'])
    expect(rows[0].text).toBe('O que fazer?')
    expect(rows[1].id).toBe(reply.id)
    expect(reply.model).toBe('models/teste')
    expect(reply.fen).toBe(START)
    expect(reply.segments?.map((s) => s.kind)).toEqual(['text'])
  })

  it('grava a pergunta antes de a resposta chegar', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const { deps } = makeDeps({
      generate: async () => {
        await gate
        return { text: 'ok', model: 'm' }
      },
    })
    const pending = askTutor({ fen: START, played: null, question: 'Oi?' }, deps)
    await vi.waitFor(async () => expect(await db.tutorMessages.count()).toBe(1))
    release()
    await pending
    expect(await db.tutorMessages.count()).toBe(2)
  })

  it('analisa lances citados', async () => {
    const { deps, analyze, generate } = makeDeps()
    await askTutor({ fen: START, played: null, question: 'e se Cf3?' }, deps)
    const fens = analyze.mock.calls.map((c) => c[0])
    expect(fens).toContain(START)
    expect(fens).toContain(afterNf3())
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('envia o histórico do mesmo fio, sem a pergunta nova', async () => {
    const { deps, generate } = makeDeps()
    await askTutor({ fen: START, played: null, question: 'Primeira?' }, deps)
    await askTutor({ fen: START, played: null, question: 'Segunda?' }, deps)
    const req = generate.mock.calls[1][0] as { messages: Array<{ role: string; text: string }> }
    expect(req.messages.map((m) => m.role)).toEqual(['user', 'model', 'user'])
    expect(req.messages[0].text).toContain('Primeira?')
    expect(req.messages[1].text).toBe('Boa pergunta.')
    expect(req.messages[2].text).toContain('Segunda?')
  })

  it('reaproveita a análise', async () => {
    const { deps, analyze } = makeDeps()
    await askTutor({ fen: START, played: null, question: 'Primeira?' }, deps)
    await askTutor({ fen: START, played: null, question: 'Segunda?' }, deps)
    expect(analyze.mock.calls.filter((c) => c[0] === START)).toHaveLength(1)
  })

  it('posições diferentes têm fios diferentes', async () => {
    const { deps } = makeDeps()
    await askTutor({ fen: START, played: null, question: 'A?' }, deps)
    await askTutor({ fen: FEN_B, played: null, question: 'B?' }, deps)
    expect(await db.tutorMessages.where('threadId').equals(threadIds.position(START)).count()).toBe(2)
    expect(await db.tutorMessages.where('threadId').equals(threadIds.position(FEN_B)).count()).toBe(2)
  })

  it('erro mantém a pergunta', async () => {
    const err = new GeminiError('rate-limit', 'muitas')
    const { deps } = makeDeps({ generate: async () => Promise.reject(err) })
    await expect(askTutor({ fen: START, played: null, question: 'Oi?' }, deps)).rejects.toBe(err)
    const rows = await db.tutorMessages.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].role).toBe('user')
  })
})

// 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 — lances das brancas: plies 1, 3, 5, 7
function gameAnalysis(): GameAnalysis {
  const sans = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5']
  const classes: Record<number, AnalyzedMove['classification']> = { 3: 'mistake', 5: 'inaccuracy', 7: 'blunder' }
  const c = new Chess()
  const moves: AnalyzedMove[] = sans.map((san, i) => {
    const fenBefore = c.fen()
    const m = c.move(san)
    const ply = i + 1
    return {
      ply,
      san,
      uci: m.from + m.to,
      color: m.color === 'w' ? 'white' : 'black',
      fenBefore,
      evalBefore: 20,
      evalAfter: classes[ply] ? -150 : 20,
      mateAfter: null,
      bestUci: m.from + m.to,
      bestSan: san,
      winLoss: classes[ply] ? ply * 3 : 0,
      classification: classes[ply] ?? 'best',
    } as AnalyzedMove
  })
  const side = { acpl: 0, inaccuracies: 0, mistakes: 0, blunders: 0, accuracy: 90 }
  return { id: 'own:g1', kind: 'own', gameId: 'g1', title: 'Teste', depth: 10, engine: 'x', createdAt: 1, moves, white: side, black: side }
}

const momentJson = (ply: number) => ({
  ply,
  title: `Lance ${ply}`,
  explanation: 'Aqui o aluno errou.',
  whatToConsider: 'Veja as ameaças.',
})

describe('generateReview', () => {
  it('descarta plies desconhecidos', async () => {
    const text = JSON.stringify({ moments: [momentJson(3), momentJson(99)], summary: 'Resumo.' })
    const { deps } = makeDeps({ generate: async () => ({ text, model: 'm' }) })
    const msg = await generateReview(gameAnalysis(), 'white', deps)
    expect(msg.review?.moments.map((m) => m.ply)).toEqual([3])
    expect(msg.text).toBe('Resumo.')
    expect(msg.role).toBe('tutor')
    expect(msg.threadId).toBe(threadIds.review('own:g1'))
    expect(msg.review?.userColor).toBe('white')
    expect(msg.review?.clean).toBe(false)
    expect(msg.review?.moments[0].explanation[0]).toEqual({ kind: 'text', text: 'Aqui o aluno errou.' })
  })

  it('analisa a posição antes de cada lance pedido', async () => {
    const text = JSON.stringify({ moments: [momentJson(3)], summary: 'Resumo.' })
    const { deps, analyze } = makeDeps({ generate: async () => ({ text, model: 'm' }) })
    const game = gameAnalysis()
    await generateReview(game, 'white', deps)
    const fens = analyze.mock.calls.map((c) => c[0])
    for (const ply of [3, 5, 7]) expect(fens).toContain(game.moves[ply - 1].fenBefore)
  })

  it('tenta de novo se o JSON não abrir', async () => {
    const ok = JSON.stringify({ moments: [momentJson(5)], summary: 'Resumo.' })
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: 'não é json', model: 'm' })
      .mockResolvedValueOnce({ text: ok, model: 'm' })
    const { deps } = makeDeps({ generate })
    const msg = await generateReview(gameAnalysis(), 'white', deps)
    expect(generate).toHaveBeenCalledTimes(2)
    expect(msg.review?.moments.map((m) => m.ply)).toEqual([5])
  })

  it('rejeita com GeminiError empty depois de duas respostas inválidas', async () => {
    const generate = vi.fn().mockResolvedValue({ text: '{"moments": 3}', model: 'm' })
    const { deps } = makeDeps({ generate })
    await expect(generateReview(gameAnalysis(), 'white', deps)).rejects.toMatchObject({ name: 'GeminiError', kind: 'empty' })
    expect(generate).toHaveBeenCalledTimes(2)
    expect(await db.tutorMessages.count()).toBe(0)
  })

  it('substitui a anterior', async () => {
    const text = JSON.stringify({ moments: [momentJson(3)], summary: 'Resumo.' })
    const { deps } = makeDeps({ generate: async () => ({ text, model: 'm' }) })
    await generateReview(gameAnalysis(), 'white', deps)
    const second = await generateReview(gameAnalysis(), 'white', deps)
    const rows = await db.tutorMessages.where('threadId').equals(threadIds.review('own:g1')).toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(second.id)
  })

  it('marca lance citado e não verificado no texto do momento', async () => {
    // posição antes do lance 3 (Cf3): Nf3 está na ficha (lance jogado); Qh5 não
    const text = JSON.stringify({
      moments: [{ ...momentJson(3), explanation: 'Foi Cf3, mas Dh5 não existe.' }],
      summary: 'Resumo.',
    })
    const { deps } = makeDeps({ generate: async () => ({ text, model: 'm' }) })
    const msg = await generateReview(gameAnalysis(), 'white', deps)
    const kinds = msg.review?.moments[0].explanation.map((s) => s.kind) ?? []
    expect(kinds).toContain('move')
    expect(kinds).toContain('unverified')
  })
})

describe('saveToNotebook', () => {
  it('cria a nota com fen, categoria, etiqueta e texto', async () => {
    const { deps } = makeDeps()
    const reply = await askTutor({ fen: START, played: null, question: 'Oi?' }, deps)
    const id = await saveToNotebook(reply)
    const note = await db.notes.get(id)
    expect(note).toMatchObject({
      title: 'Explicação do tutor',
      body: 'Boa pergunta.',
      category: 'Tutor',
      tags: ['tutor'],
      fen: START,
      collectionIds: [],
      gameRef: null,
      favorite: false,
      isMistake: false,
    })
    const log = await db.activity.toArray()
    expect(log[0]).toMatchObject({ kind: 'note', title: 'Nota criada', detail: 'Tutor', link: `/caderno?nota=${id}` })
  })
})
