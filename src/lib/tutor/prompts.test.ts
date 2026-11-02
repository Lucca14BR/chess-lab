import { describe, expect, it } from 'vitest'
import { REVIEW_SCHEMA, chatRequest, levelFromStats, reviewRequest, systemPrompt } from './prompts'
import type { PositionFacts } from './types'
import type { ReviewMoment } from './review'
import type { ChessComStats } from '@/lib/chesscom/types'

const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const facts: PositionFacts = {
  fen: FEN,
  sideToMove: 'white',
  gameOver: null,
  inCheck: false,
  legalMoveCount: 20,
  material: { white: 39, black: 39 },
  bestLines: [],
  played: null,
  asked: [],
  hanging: [],
  checks: [],
  captures: [],
  mateInOne: null,
}

const point = (rating: number) => ({ last: { rating, date: 0, rd: 50 } })

function moment(ply: number): ReviewMoment {
  return {
    ply,
    reason: 'blunder',
    move: {
      ply,
      san: 'Qh5',
      uci: 'd1h5',
      color: 'white',
      fenBefore: FEN,
      evalBefore: 20,
      evalAfter: -300,
      mateAfter: null,
      bestUci: 'e2e4',
      bestSan: 'e4',
      winLoss: 35,
      classification: 'blunder',
    },
  }
}

describe('levelFromStats', () => {
  it('sem conta, intermediário', () => {
    expect(levelFromStats(null)).toBe('intermediario')
    expect(levelFromStats(undefined)).toBe('intermediario')
  })
  it('rapid 1150 é iniciante', () => {
    expect(levelFromStats({ chess_rapid: point(1150) } as ChessComStats)).toBe('iniciante')
  })
  it('usa o maior rating entre os modos', () => {
    const stats = { chess_rapid: point(1150), chess_blitz: point(1850) } as ChessComStats
    expect(levelFromStats(stats)).toBe('avancado')
  })
  it('1200 exato é intermediário e 1800 é avançado', () => {
    expect(levelFromStats({ chess_blitz: point(1200) } as ChessComStats)).toBe('intermediario')
    expect(levelFromStats({ chess_blitz: point(1799) } as ChessComStats)).toBe('intermediario')
    expect(levelFromStats({ chess_blitz: point(1800) } as ChessComStats)).toBe('avancado')
  })
  it('conta sem ratings é intermediário', () => {
    expect(levelFromStats({} as ChessComStats)).toBe('intermediario')
  })
})

describe('systemPrompt', () => {
  it('fixa idioma, regra dos fatos, ponto de vista das avaliações e nível', () => {
    const p = systemPrompt('iniciante')
    expect(p).toContain('português do Brasil')
    expect(p).toContain('use apenas os fatos')
    expect(p).toContain('iniciante')
    expect(p).toContain('ponto de vista das brancas')
    expect(systemPrompt('avancado')).toContain('avancado')
  })

  it('texto simples, notação, unidades e regra dos fatos sem brechas', () => {
    const p = systemPrompt('avancado')
    expect(p).toContain('Responda em texto simples, sem Markdown (sem asteriscos, títulos ou listas com *).')
    expect(p).toContain('SAN em inglês (N = cavalo, B = bispo, R = torre, Q = dama, K = rei)')
    expect(p).toContain('notação portuguesa (C = cavalo, B = bispo, T = torre, D = dama, R = rei)')
    expect(p).toContain('pontos percentuais de chance de vitória perdidos')
    expect(p).toContain('P = 1, C e B = 3, T = 5, D = 9')
    expect(p).toContain('acompanham a última mensagem do aluno')
    expect(p).not.toContain('cada mensagem')
    expect(p).not.toContain('pode citar planos, estruturas e casas críticas')
    expect(p).toContain('somente quando a ficha sustentar')
  })
})

describe('chatRequest', () => {
  const history = Array.from({ length: 10 }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'tutor') as 'user' | 'tutor',
    text: `msg ${i}`,
  }))

  it('envia as 6 últimas mensagens mais a pergunta com a ficha', () => {
    const req = chatRequest(facts, history, 'Por que não Dxf7?', 'intermediario')
    expect(req.messages).toHaveLength(7)
    expect(req.messages[0]).toEqual({ role: 'user', text: 'msg 4' })
    expect(req.messages[1]).toEqual({ role: 'model', text: 'msg 5' })
    const last = req.messages[6]
    expect(last.role).toBe('user')
    expect(last.text).toContain('Por que não Dxf7?')
    expect(last.text).toContain('Fatos calculados pelo Chess Lab (Stockfish + regras):')
    expect(last.text).toContain(JSON.stringify(facts))
    expect(req.system).toBe(systemPrompt('intermediario'))
  })

  it('funde mensagens seguidas do mesmo papel (pergunta sem resposta)', () => {
    const h = [
      { role: 'user' as const, text: 'primeira' },
      { role: 'tutor' as const, text: 'resposta' },
      { role: 'user' as const, text: 'sem resposta' },
    ]
    const req = chatRequest(facts, h, 'de novo', 'avancado')
    expect(req.messages.map((m) => m.role)).toEqual(['user', 'model', 'user'])
    expect(req.messages[2].text).toContain('sem resposta')
    expect(req.messages[2].text).toContain('de novo')
  })

  it('começa sempre por uma mensagem do usuário', () => {
    const h = [
      { role: 'tutor' as const, text: 'sobrou' },
      { role: 'user' as const, text: 'q' },
      { role: 'tutor' as const, text: 'a' },
    ]
    const req = chatRequest(facts, h, 'outra', 'avancado')
    expect(req.messages[0].role).toBe('user')
  })
})

describe('reviewRequest', () => {
  const items = [moment(7), moment(12)].map((m) => ({ moment: m, facts }))

  it('usa o schema, inclui cada ply e a cor do usuário', () => {
    const req = reviewRequest(items, false, 'black', 'intermediario')
    expect(req.jsonSchema).toBe(REVIEW_SCHEMA)
    const text = req.messages.map((m) => m.text).join('\n')
    expect(text).toContain('"ply":7')
    expect(text).toContain('"ply":12')
    expect(text).toContain('pretas')
    expect(text).toContain('"evalBefore":"+0.20"')
    expect(text).toContain('"evalAfter":"-3.00"')
    const mate = reviewRequest([{ moment: { ...moment(7), move: { ...moment(7).move, evalBefore: 9970 } }, facts }], false, 'white', 'avancado')
    expect(mate.messages[0].text).toContain('"evalBefore":"M3"')
    expect(text).not.toContain('a partida não teve erros graves')
    expect(req.messages.every((m) => m.role === 'user')).toBe(true)
  })

  it('partida limpa avisa que não teve erros graves', () => {
    const req = reviewRequest(items, true, 'white', 'avancado')
    expect(req.messages.map((m) => m.text).join('\n')).toContain('a partida não teve erros graves')
  })

  it('schema exige todos os campos', () => {
    const s = REVIEW_SCHEMA as any
    expect(s.required).toEqual(['moments', 'summary'])
    expect(s.properties.moments.items.required).toEqual(['ply', 'title', 'explanation', 'whatToConsider'])
  })
})
