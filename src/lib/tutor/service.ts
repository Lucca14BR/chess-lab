// Serviço do tutor: pergunta → análise do motor → ficha → Gemini → conferência → Dexie.
// As dependências (motor, Gemini, nível) são injetáveis para testar sem motor nem rede.
import { Chess } from 'chess.js'
import { GeminiError, defaultModels, generate as geminiGenerate, listModels } from '@/lib/ai/gemini'
import type { GenerateRequest, GenerateResult } from '@/lib/ai/gemini'
import { positionKey, START_FEN } from '@/lib/chess/board'
import { db } from '@/lib/db/schema'
import type { AnalyzedMove, GameAnalysis, NoteRow, TutorMessage } from '@/lib/db/schema'
import { engine } from '@/lib/engine/stockfish'
import type { AnalysisResult } from '@/lib/engine/stockfish'
import { logActivity } from '@/lib/services/activity'
import { getSettings, setSetting } from '@/lib/settings'
import { uid } from '@/lib/utils'
import { buildFacts } from './facts'
import { getGeminiKey, threadIds } from './key'
import { findMoves } from './moves'
import { chatRequest, levelFromStats, reviewRequest } from './prompts'
import type { TutorLevel } from './prompts'
import { pickMoments } from './review'
import type { PositionFacts, Segment } from './types'
import { plainText, verifyText } from './verify'

export interface TutorDeps {
  analyze: (fen: string) => Promise<AnalysisResult>
  generate: (req: GenerateRequest) => Promise<GenerateResult>
  level: () => Promise<TutorLevel>
}

const MULTI_PV = 3
const REVIEW_ATTEMPTS = 2 // uma tentativa extra se o JSON da revisão não abrir

// Padrão: motor com a profundidade das Configurações
async function defaultAnalyze(fen: string): Promise<AnalysisResult> {
  const { engineDepth } = await getSettings()
  return engine.analyze(fen, { depth: engineDepth, multiPv: MULTI_PV })
}

// Padrão: chave local e modelos escolhidos nas Configurações.
// Sem modelo escolhido, aplica o padrão da lista da chave (como "Testar chave") e salva
async function defaultGenerate(req: GenerateRequest): Promise<GenerateResult> {
  const key = await getGeminiKey()
  if (!key) throw new GeminiError('no-key', 'Nenhuma chave do Gemini configurada.')
  let { tutorPrimaryModel: primary, tutorFallbackModel: fallback } = await getSettings()
  if (!primary) {
    const d = defaultModels(await listModels(key))
    if (!d.primary) throw new GeminiError('no-model', 'Escolha um modelo em Configurações.')
    primary = d.primary
    fallback = fallback ?? d.fallback
    await setSetting('tutorPrimaryModel', primary)
    await setSetting('tutorFallbackModel', fallback)
  }
  return geminiGenerate(key, { primary, fallback }, req)
}

// Padrão: nível pelas estatísticas do Chess.com
async function defaultLevel(): Promise<TutorLevel> {
  return levelFromStats((await db.account.get('chesscom'))?.stats)
}

// Fase do pedido, para a tela: motor rodando ou esperando o Gemini
export type TutorPhase = 'analyzing' | 'consulting'

const resolveDeps = (deps: Partial<TutorDeps>): TutorDeps => ({
  analyze: defaultAnalyze,
  generate: defaultGenerate,
  level: defaultLevel,
  ...deps,
})

// Cache em memória das análises, por posição (guarda a promessa para juntar pedidos simultâneos)
const cache = new Map<string, Promise<AnalysisResult>>()

export function clearTutorCache(): void {
  cache.clear()
}

function cachedAnalyze(deps: TutorDeps, fen: string, onPhase?: (p: TutorPhase) => void): Promise<AnalysisResult> {
  const key = positionKey(fen)
  let hit = cache.get(key)
  if (!hit) {
    onPhase?.('analyzing') // só quando o motor precisa rodar
    hit = deps.analyze(fen)
    cache.set(key, hit)
    hit.catch(() => cache.delete(key)) // falha não fica guardada
  }
  return hit
}

// FEN depois de um lance UCI (null se ilegal)
function fenAfterUci(fen: string, uci: string): string | null {
  try {
    const c = new Chess(fen)
    c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return c.fen()
  } catch {
    return null
  }
}

// Lances citados na pergunta, sem repetição
function mentionedMoves(question: string, fen: string): Array<{ san: string; uci: string }> {
  const seen = new Map<string, { san: string; uci: string }>()
  for (const m of findMoves(question, fen)) seen.set(m.uci, { san: m.san, uci: m.uci })
  return [...seen.values()]
}

async function askedWithEngine(deps: TutorDeps, fen: string, question: string, onPhase?: (p: TutorPhase) => void) {
  const asked: Array<{ san: string; uci: string; engine: AnalysisResult | null }> = []
  for (const m of mentionedMoves(question, fen)) {
    const after = fenAfterUci(fen, m.uci)
    asked.push({ ...m, engine: after ? await cachedAnalyze(deps, after, onPhase) : null })
  }
  return asked
}

export async function askTutor(
  input: { fen: string; played: AnalyzedMove | null; question: string },
  deps: Partial<TutorDeps> = {},
  options: { onPhase?: (p: TutorPhase) => void } = {},
): Promise<TutorMessage> {
  const d = resolveDeps(deps)
  const { fen, played, question } = input
  const { onPhase } = options
  const threadId = threadIds.position(fen)

  // Histórico = mensagens anteriores do mesmo fio, da mais antiga para a mais nova
  const earlier = await db.tutorMessages.where('threadId').equals(threadId).sortBy('createdAt')
  const history = earlier.map((m) => ({ role: m.role, text: m.text }))

  // A pergunta fica gravada mesmo que o resto falhe
  const asking: TutorMessage = {
    id: uid(),
    threadId,
    role: 'user',
    text: question,
    segments: null,
    model: null,
    fen,
    createdAt: Date.now(),
  }
  await db.tutorMessages.add(asking)

  const facts = buildFacts({
    fen,
    engine: await cachedAnalyze(d, fen, onPhase),
    played,
    asked: await askedWithEngine(d, fen, question, onPhase),
  })
  const level = await d.level()
  onPhase?.('consulting')
  const result = await d.generate(chatRequest(facts, history, question, level))
  const text = plainText(result.text)

  const reply: TutorMessage = {
    id: uid(),
    threadId,
    role: 'tutor',
    text,
    segments: verifyText(text, facts),
    model: result.model,
    fen,
    createdAt: Math.max(Date.now(), asking.createdAt + 1), // sempre depois da pergunta
  }
  await db.tutorMessages.add(reply)
  return reply
}

type ReviewMomentOut = NonNullable<TutorMessage['review']>['moments'][number]

interface RawReview {
  moments: Array<Record<string, unknown>>
  summary: string
}

// Momento devolvido pela IA para o ply pedido, com todos os campos de texto
function momentFor(raw: RawReview, ply: number): Record<string, unknown> | undefined {
  return raw.moments.find(
    (m) => m.ply === ply && typeof m.title === 'string' && typeof m.explanation === 'string' && typeof m.whatToConsider === 'string',
  )
}

// Lê o JSON da revisão; null se não abrir, não tiver o formato esperado ou nenhum dos plies pedidos
function parseReview(text: string, plies: number[]): RawReview | null {
  try {
    const data: unknown = JSON.parse(text)
    if (!data || typeof data !== 'object') return null
    const { moments, summary } = data as Record<string, unknown>
    if (!Array.isArray(moments) || typeof summary !== 'string') return null
    const raw = { moments: moments.filter((m): m is Record<string, unknown> => !!m && typeof m === 'object'), summary }
    if (plies.length > 0 && !plies.some((ply) => momentFor(raw, ply))) return null
    return raw
  } catch {
    return null
  }
}

export async function generateReview(
  analysis: GameAnalysis,
  userColor: 'white' | 'black',
  deps: Partial<TutorDeps> = {},
): Promise<TutorMessage> {
  const d = resolveDeps(deps)
  const threadId = threadIds.review(analysis.id)
  const { moments, clean } = pickMoments(analysis.moves, userColor)

  // Ficha de cada momento: posição antes do lance, o lance jogado e 3 linhas do motor
  const items: Array<{ moment: (typeof moments)[number]; facts: PositionFacts }> = []
  for (const moment of moments) {
    const fen = moment.move.fenBefore
    const facts = buildFacts({ fen, engine: await cachedAnalyze(d, fen), played: moment.move, asked: [] })
    items.push({ moment, facts })
  }

  const req = reviewRequest(items, clean, userColor, await d.level())
  let raw: RawReview | null = null
  let model = ''
  for (let attempt = 0; attempt < REVIEW_ATTEMPTS && !raw; attempt++) {
    const result = await d.generate(req)
    model = result.model
    raw = parseReview(result.text, items.map((i) => i.moment.ply))
  }
  if (!raw) throw new GeminiError('empty', 'O tutor devolveu uma revisão que não pude ler. Tente de novo.')

  // Só os momentos pedidos, na ordem pedida; cada texto é conferido com a ficha do próprio momento
  const out: ReviewMomentOut[] = []
  for (const { moment, facts } of items) {
    const found = momentFor(raw, moment.ply)
    if (!found) continue
    out.push({
      ply: moment.ply,
      title: plainText(found.title as string),
      explanation: verifyText(plainText(found.explanation as string), facts),
      whatToConsider: verifyText(plainText(found.whatToConsider as string), facts),
    })
  }
  // O resumo fala da partida toda: vale a ficha de qualquer momento
  const summaryText = plainText(raw.summary)
  const summary: Segment[] = verifyText(summaryText, items.map((i) => i.facts))

  const message: TutorMessage = {
    id: uid(),
    threadId,
    role: 'tutor',
    text: summaryText,
    segments: summary,
    model,
    fen: analysis.moves[0]?.fenBefore ?? START_FEN,
    createdAt: Date.now(),
    review: { moments: out, summary, userColor, clean },
  }
  // Troca a revisão anterior de uma vez só
  await db.transaction('rw', db.tutorMessages, async () => {
    await db.tutorMessages.where('threadId').equals(threadId).delete()
    await db.tutorMessages.add(message)
  })
  return message
}

export async function saveToNotebook(msg: TutorMessage): Promise<string> {
  const now = Date.now()
  const note: NoteRow = {
    id: uid(),
    title: 'Explicação do tutor',
    body: plainText(msg.text),
    category: 'Tutor',
    collectionIds: [],
    tags: ['tutor'],
    fen: msg.fen,
    gameRef: null,
    favorite: false,
    isMistake: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.notes.add(note)
  await logActivity({ kind: 'note', title: 'Nota criada', detail: note.category, link: `/caderno?nota=${note.id}` })
  return note.id
}
