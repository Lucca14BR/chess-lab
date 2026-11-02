// Instruções enviadas ao Gemini: nível, sistema, conversa e revisão
import type { GenerateRequest } from '@/lib/ai/gemini'
import type { ChessComStats } from '@/lib/chesscom/types'
import { modeStats } from '@/lib/chesscom/normalize'
import type { TimeClass } from '@/lib/db/schema'
import { formatEval } from '@/lib/engine/stockfish'
import type { PositionFacts } from './types'
import type { ReviewMoment } from './review'

export type TutorLevel = 'iniciante' | 'intermediario' | 'avancado'

const MODES: TimeClass[] = ['bullet', 'blitz', 'rapid', 'daily']
const MAX_HISTORY = 6 // mensagens anteriores enviadas na conversa
const FACTS_INTRO = 'Fatos calculados pelo Chess Lab (Stockfish + regras):'

// Nível pelo maior rating atual do Chess.com; sem conta, intermediário
export function levelFromStats(stats: ChessComStats | null | undefined): TutorLevel {
  const ratings = MODES.map((tc) => modeStats(stats, tc)?.last?.rating).filter(
    (r): r is number => typeof r === 'number',
  )
  if (ratings.length === 0) return 'intermediario'
  const best = Math.max(...ratings)
  if (best < 1200) return 'iniciante'
  if (best < 1800) return 'intermediario'
  return 'avancado'
}

const LEVEL_HINT: Record<TutorLevel, string> = {
  iniciante: 'Use palavras simples, explique os conceitos básicos e evite jargão.',
  intermediario: 'Pode usar termos comuns de xadrez (garfo, cravada, estrutura de peões) com breves explicações.',
  avancado: 'Seja direto e técnico; pode citar planos, estruturas e casas críticas sem explicar o básico.',
}

export function systemPrompt(level: TutorLevel): string {
  return [
    'Você é o tutor de xadrez do Chess Lab. Responda sempre em português do Brasil.',
    'Explique a posição usando apenas os fatos calculados que acompanham cada mensagem (Stockfish + regras): use apenas os fatos da ficha e não invente nada além deles.',
    'Não sugira lances que não estejam na ficha. Se a ficha não permite responder, diga isso com clareza.',
    'Todas as avaliações da ficha (eval, evalBefore, evalAfter) estão no ponto de vista das brancas: valor positivo é bom para as brancas, negativo é bom para as pretas (em peões; "M3" é mate em 3 para as brancas e "-M3" para as pretas).',
    'Escreva os lances em notação portuguesa (C = cavalo, B = bispo, T = torre, D = dama, R = rei), por exemplo Cf3 ou Dxf7.',
    'Seja breve: na conversa, até cerca de 150 palavras.',
    `Nível do aluno: ${level}. ${LEVEL_HINT[level]}`,
  ].join('\n')
}

// Ficha como JSON compacto
const factsBlock = (facts: PositionFacts) => `${FACTS_INTRO}\n${JSON.stringify(facts)}`

type Msg = GenerateRequest['messages'][number]

// A API exige papéis alternados: junta mensagens seguidas do mesmo papel
function mergeSameRole(messages: Msg[]): Msg[] {
  const out: Msg[] = []
  for (const m of messages) {
    const prev = out[out.length - 1]
    if (prev && prev.role === m.role) prev.text += `\n\n${m.text}`
    else out.push({ ...m })
  }
  return out
}

export function chatRequest(
  facts: PositionFacts,
  history: Array<{ role: 'user' | 'tutor'; text: string }>,
  question: string,
  level: TutorLevel,
): GenerateRequest {
  const past: Msg[] = history
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role === 'tutor' ? 'model' : 'user', text: m.text }))
  while (past.length > 0 && past[0].role === 'model') past.shift() // a conversa começa pelo usuário
  const messages = mergeSameRole([...past, { role: 'user', text: `${factsBlock(facts)}\n\nPergunta: ${question}` }])
  return { system: systemPrompt(level), messages }
}

export const REVIEW_SCHEMA: object = {
  type: 'object',
  properties: {
    moments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ply: { type: 'integer' },
          title: { type: 'string' },
          explanation: { type: 'string' },
          whatToConsider: { type: 'string' },
        },
        required: ['ply', 'title', 'explanation', 'whatToConsider'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['moments', 'summary'],
}

export function reviewRequest(
  items: Array<{ moment: ReviewMoment; facts: PositionFacts }>,
  clean: boolean,
  userColor: 'white' | 'black',
  level: TutorLevel,
): GenerateRequest {
  const side = userColor === 'white' ? 'brancas' : 'pretas'
  const moments = items.map(({ moment, facts }) => ({
    ply: moment.ply,
    reason: moment.reason,
    played: moment.move.san,
    best: moment.move.bestSan,
    evalBefore: formatEval({ cp: moment.move.evalBefore, mate: null }),
    evalAfter: formatEval({ cp: moment.move.evalAfter, mate: moment.move.mateAfter }),
    winLoss: moment.move.winLoss,
    facts,
  }))
  const text = [
    `Revise a partida do aluno, que jogou com as ${side}. Comente apenas os lances dele, nos momentos abaixo (evalBefore/evalAfter no ponto de vista das brancas).`,
    clean
      ? 'A partida não teve erros graves: os momentos são só as maiores viradas. No resumo, diga que a partida não teve erros graves e destaque o que foi bem jogado.'
      : 'Para cada momento, explique o que aconteceu e o que o aluno deveria considerar.',
    'Responda no JSON do esquema: em cada momento use o mesmo "ply" recebido, um título curto, a explicação e "whatToConsider" (o que considerar na posição); em "summary", um resumo da partida em poucas frases.',
    `${FACTS_INTRO}\n${JSON.stringify(moments)}`,
  ].join('\n\n')
  return { system: systemPrompt(level), messages: [{ role: 'user', text }], jsonSchema: REVIEW_SCHEMA }
}
