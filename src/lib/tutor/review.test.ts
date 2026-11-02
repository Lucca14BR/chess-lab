import { describe, expect, it } from 'vitest'
import { pickMoments } from './review'
import type { AnalyzedMove, MoveClass } from '@/lib/db/schema'

const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function cls(winLoss: number): MoveClass {
  if (winLoss >= 30) return 'blunder'
  if (winLoss >= 20) return 'mistake'
  if (winLoss >= 10) return 'inaccuracy'
  return 'good'
}

// Partida sintética de 20 lances; losses = perda por ply (padrão 2); swings = variação de avaliação por ply
function game(losses: Record<number, number> = {}, swings: Record<number, number> = {}): AnalyzedMove[] {
  return Array.from({ length: 20 }, (_, i) => {
    const ply = i + 1
    const winLoss = losses[ply] ?? 2
    const delta = swings[ply] ?? 0
    return {
      ply,
      san: 'e4',
      uci: 'e2e4',
      color: ply % 2 === 1 ? 'white' : 'black',
      fenBefore: FEN,
      evalBefore: 0,
      evalAfter: delta,
      mateAfter: null,
      bestUci: 'd2d4',
      bestSan: 'd4',
      winLoss,
      classification: cls(winLoss),
    }
  })
}

describe('pickMoments', () => {
  it('muitos erros: os 5 maiores, em ordem de lance', () => {
    // plies brancos (ímpares) 1..13 com perdas 35, 32, 25, 22, 15, 12, 11
    const g = game({ 1: 35, 3: 32, 5: 25, 7: 22, 9: 15, 11: 12, 13: 11 })
    const { moments, clean } = pickMoments(g, 'white')
    expect(clean).toBe(false)
    expect(moments.map((m) => m.ply)).toEqual([1, 3, 5, 7, 9])
    expect(moments.map((m) => m.reason)).toEqual(['blunder', 'blunder', 'mistake', 'mistake', 'inaccuracy'])
  })

  it('poucos erros: erro + 2 maiores viradas', () => {
    const g = game({ 5: 30 }, { 1: 50, 3: 300, 7: 120, 9: 400, 11: 10 })
    const { moments, clean } = pickMoments(g, 'white')
    expect(clean).toBe(false)
    expect(moments).toHaveLength(3)
    expect(moments.find((m) => m.ply === 5)?.reason).toBe('blunder')
    const swings = moments.filter((m) => m.reason === 'swing').map((m) => m.ply)
    expect(swings.sort((a, b) => a - b)).toEqual([3, 9])
  })

  it('partida limpa: 3 viradas', () => {
    const g = game({}, { 1: 20, 3: 200, 5: 80, 7: 5, 9: 150 })
    const { moments, clean } = pickMoments(g, 'white')
    expect(clean).toBe(true)
    expect(moments.map((m) => m.ply)).toEqual([3, 5, 9])
    expect(moments.every((m) => m.reason === 'swing')).toBe(true)
  })

  it('só a cor do usuário', () => {
    // erros graves das pretas (plies pares) não entram para as brancas
    const g = game({ 2: 40, 4: 40, 6: 40, 3: 25 })
    const white = pickMoments(g, 'white')
    expect(white.moments.every((m) => m.move.color === 'white')).toBe(true)
    expect(white.moments.find((m) => m.ply === 3)?.reason).toBe('mistake')
    const black = pickMoments(g, 'black')
    expect(black.moments.map((m) => m.ply)).toEqual([2, 4, 6])
    expect(black.moments.every((m) => m.move.color === 'black')).toBe(true)
  })
})
