// Instruções enviadas ao Gemini: nível, sistema, conversa e revisão
import type { GenerateRequest } from '@/lib/ai/gemini'
import type { ChessComStats } from '@/lib/chesscom/types'
import { modeStats } from '@/lib/chesscom/normalize'
import type { TimeClass } from '@/lib/db/schema'
import { evalText } from './facts'
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
  avancado: 'Seja direto e técnico, sem explicar o básico; fale de planos e estruturas somente quando a ficha sustentar.',
}

// Regras comuns aos dois modos: avaliações, notação, formato, tamanho, nível e nome.
// Com nome, o tutor fala com a pessoa como um professor particular
function commonRules(level: TutorLevel, name: string | undefined, maxWords: number): string[] {
  const who = name?.trim()
  return [
    'Todas as avaliações da ficha (eval, evalBefore, evalAfter) estão no ponto de vista das brancas: valor positivo é bom para as brancas, negativo é bom para as pretas (em peões; "M3" é mate em 3 para as brancas e "-M3" para as pretas).',
    'Na ficha, winLoss são os pontos percentuais de chance de vitória perdidos com o lance, e material soma P = 1, C e B = 3, T = 5, D = 9.',
    'A ficha usa SAN em inglês (N = cavalo, B = bispo, R = torre, Q = dama, K = rei). Na resposta, escreva os lances em notação portuguesa (C = cavalo, B = bispo, T = torre, D = dama, R = rei), por exemplo Cf3 ou Dxf7.',
    'Responda em texto simples, sem Markdown (sem asteriscos, títulos ou listas com *).',
    `Seja breve: na conversa, até cerca de ${maxWords} palavras.`,
    `Nível do aluno: ${level}. ${LEVEL_HINT[level]}`,
    ...(who
      ? [`O aluno se chama ${who}. Fale com a pessoa em "você" e use o nome de vez em quando, como um professor particular, sem exagero e sem presumir gênero.`]
      : []),
  ]
}

// Tutor da posição (Tabuleiro): só os fatos da ficha
export function systemPrompt(level: TutorLevel, name?: string): string {
  return [
    'Você é o tutor de xadrez do Chess Lab. Responda sempre em português do Brasil.',
    'Explique a posição usando apenas os fatos calculados que acompanham a última mensagem do aluno (Stockfish + regras): use apenas os fatos da ficha e não invente nada além deles.',
    'Não sugira lances que não estejam na ficha. Se a ficha não permite responder, diga isso com clareza.',
    ...commonRules(level, name, 150),
  ].join('\n')
}

// Página Conversa: conversa livre sobre xadrez; quando a ficha vem junto, ela manda nos fatos da posição
export function chatSystemPrompt(level: TutorLevel, name?: string): string {
  return [
    'Você é o tutor de xadrez do Chess Lab, numa conversa livre com o aluno. Responda sempre em português do Brasil.',
    'Para perguntas gerais (aberturas, planos típicos, finais, como treinar), use seu conhecimento geral de xadrez e deixe claro quando algo é um conselho geral, e não uma análise da posição do tabuleiro.',
    'Quando a última mensagem do aluno trouxer a ficha de fatos calculados pelo Chess Lab (Stockfish + regras), os fatos sobre a posição do tabuleiro vêm só da ficha: não invente avaliações, ameaças nem variantes.',
    'Lances concretos para a posição atual, só os da ficha. Lances de exemplo de um conselho geral (por exemplo, numa abertura) podem aparecer, mas diga que são gerais e não foram conferidos na posição.',
    'Sem ficha, você não vê nenhum tabuleiro: não afirme nada sobre uma posição concreta; se o aluno perguntar sobre a posição, peça para anexar a posição do tabuleiro.',
    ...commonRules(level, name, 200),
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

type History = Array<{ role: 'user' | 'tutor'; text: string }>

// Histórico recente (só as últimas mensagens), começando pelo usuário, mais a mensagem nova
function conversation(history: History, last: string): Msg[] {
  const past: Msg[] = history
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role === 'tutor' ? 'model' : 'user', text: m.text }))
  while (past.length > 0 && past[0].role === 'model') past.shift() // a conversa começa pelo usuário
  return mergeSameRole([...past, { role: 'user', text: last }])
}

export function chatRequest(facts: PositionFacts, history: History, question: string, level: TutorLevel, name?: string): GenerateRequest {
  return { system: systemPrompt(level, name), messages: conversation(history, `${factsBlock(facts)}\n\nPergunta: ${question}`) }
}

// Página Conversa: com ficha (posição anexada) ou sem ela (pergunta geral)
export function freeChatRequest(facts: PositionFacts | null, history: History, question: string, level: TutorLevel, name?: string): GenerateRequest {
  const head = facts ? factsBlock(facts) : '(Sem posição anexada: não há ficha nesta pergunta.)'
  return { system: chatSystemPrompt(level, name), messages: conversation(history, `${head}\n\nPergunta: ${question}`) }
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
  name?: string,
): GenerateRequest {
  const side = userColor === 'white' ? 'brancas' : 'pretas'
  const moments = items.map(({ moment, facts }) => ({
    ply: moment.ply,
    reason: moment.reason,
    played: moment.move.san,
    best: moment.move.bestSan,
    evalBefore: evalText(moment.move.evalBefore, null),
    evalAfter: evalText(moment.move.evalAfter, moment.move.mateAfter),
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
  return { system: systemPrompt(level, name), messages: [{ role: 'user', text }], jsonSchema: REVIEW_SCHEMA }
}
