import { describe, expect, it } from 'vitest'
import { buildFacts, factsMoves, factsPositions } from './facts'
import type { AnalysisResult } from '@/lib/engine/stockfish'
import type { AnalyzedMove } from '@/lib/db/schema'
import type { FactsInput } from './types'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function input(fen: string, extra: Partial<FactsInput> = {}): FactsInput {
  return { fen, engine: null, played: null, asked: [], ...extra }
}

describe('buildFacts', () => {
  it('peça solta', () => {
    const f = buildFacts(input('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1'))
    expect(f.hanging).toContainEqual({ square: 'd5', piece: 'dama', color: 'black' })
    expect(f.captures).toContain('Rxd5')
  })

  it('peça defendida não é solta', () => {
    const f = buildFacts(input('4k3/8/2p5/3q4/8/8/3R4/4K3 w - - 0 1'))
    expect(f.hanging.find((p) => p.square === 'd5')).toBeUndefined()
  })

  it('mate em 1', () => {
    const f = buildFacts(input('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1'))
    expect(f.mateInOne).toBe('Ra8#')
    expect(f.checks).toContain('Ra8#')
  })

  it('material', () => {
    const f = buildFacts(input(START))
    expect(f.material).toEqual({ white: 39, black: 39 })
    expect(f.sideToMove).toBe('white')
    expect(f.legalMoveCount).toBe(20)
    expect(f.gameOver).toBeNull()
    expect(f.hanging).toEqual([])
  })

  it('linhas do motor viram SAN', () => {
    const engine: AnalysisResult = {
      fen: START,
      depth: 12,
      lines: [{ multipv: 1, depth: 12, cp: 35, mate: null, pv: ['e2e4', 'e7e5'] }],
      bestMove: 'e2e4',
    }
    const f = buildFacts(input(START, { engine }))
    expect(f.bestLines[0]).toEqual({ san: ['e4', 'e5'], uci: ['e2e4', 'e7e5'], eval: '+0.35' })
  })

  it('ficha de posição de mate', () => {
    const engine: AnalysisResult = {
      fen: 'R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
      depth: 0,
      lines: [],
      bestMove: null,
    }
    const f = buildFacts(input('R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', { engine }))
    expect(f.gameOver).toBe('checkmate')
    expect(f.inCheck).toBe(true)
    expect(f.bestLines).toEqual([])
  })
})

describe('factsMoves / factsPositions', () => {
  const played: AnalyzedMove = {
    ply: 1,
    san: 'e4',
    uci: 'e2e4',
    color: 'w',
    fenBefore: START,
    evalBefore: 20,
    evalAfter: 30,
    mateAfter: null,
    bestUci: 'd2d4',
    bestSan: 'd4',
    winLoss: 1.5,
    classification: 'good',
  }
  const engine: AnalysisResult = {
    fen: START,
    depth: 12,
    lines: [{ multipv: 1, depth: 12, cp: 35, mate: null, pv: ['e2e4', 'e7e5'] }],
    bestMove: 'e2e4',
  }
  const askedEngine: AnalysisResult = {
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    depth: 12,
    lines: [{ multipv: 1, depth: 12, cp: 20, mate: null, pv: ['d7d5', 'c2c4'] }],
    bestMove: 'd7d5',
  }
  const f = buildFacts(
    input(START, { engine, played, asked: [{ san: 'd4', uci: 'd2d4', engine: askedEngine }] }),
  )

  it('monta lance jogado e perguntado', () => {
    expect(f.played).toEqual({
      san: 'e4',
      uci: 'e2e4',
      fenBefore: START,
      evalBefore: '+0.20',
      evalAfter: '+0.30',
      winLoss: 1.5,
      classification: 'good',
      bestSan: 'd4',
    })
    expect(f.asked).toEqual([{ san: 'd4', uci: 'd2d4', evalAfter: '+0.20', reply: ['d5', 'c4'] }])
  })

  it('factsMoves inclui SAN de linhas, jogado, melhor e perguntados', () => {
    const moves = factsMoves(f)
    for (const san of ['e4', 'e5', 'd4', 'd5', 'c4']) expect(moves.has(san)).toBe(true)
  })

  it('factsPositions inclui FEN da ficha, fenBefore e posições depois dos lances', () => {
    const fens = factsPositions(f)
    expect(fens).toContain(START)
    expect(fens).toContain('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
    expect(fens).toContain('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1')
    expect(new Set(fens).size).toBe(fens.length)
  })

  it('factsPositions com fenBefore diferente da FEN da ficha: conjunto exato', () => {
    const apos = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    const eng = (pv: string[], fen: string): AnalysisResult => ({
      fen,
      depth: 12,
      lines: [{ multipv: 1, depth: 12, cp: 10, mate: null, pv }],
      bestMove: pv[0],
    })
    const g = buildFacts(
      input(apos, {
        engine: eng(['e7e5', 'g1f3'], apos),
        played, // e2e4 jogado a partir de START (a ficha é da posição depois dele)
        asked: [{ san: 'd5', uci: 'd7d5', engine: eng(['e4d5', 'd8d5'], '') }],
      }),
    )
    expect(g.asked[0].reply).toEqual(['exd5', 'Qxd5'])
    expect(new Set(factsPositions(g))).toEqual(
      new Set([
        apos, // FEN da ficha (também a posição depois do lance jogado)
        START, // fenBefore do lance jogado
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', // linha, 1º lance
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', // linha, 2º lance
        'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', // depois do lance perguntado
        'rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2', // resposta, 1º lance
        'rnb1kbnr/ppp1pppp/8/3q4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3', // resposta, 2º lance
      ]),
    )
  })
})
