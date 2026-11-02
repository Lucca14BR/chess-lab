import type { AnalyzedMove } from '@/lib/db/schema'
import { winChance } from '@/lib/engine/stockfish'

export interface ReviewMoment {
  ply: number
  move: AnalyzedMove
  reason: 'blunder' | 'mistake' | 'inaccuracy' | 'swing'
}

const MAX_MOMENTS = 5 // erros mostrados no máximo
const MIN_MOMENTS = 3 // completa com viradas quando há poucos erros

// Quanto a chance de vitória (pontos de vista das brancas) mudou com o lance
const swing = (m: AnalyzedMove) => Math.abs(winChance(m.evalAfter) - winChance(m.evalBefore))

// Momentos decisivos da partida para a cor do usuário, em ordem de lance
export function pickMoments(
  moves: AnalyzedMove[],
  userColor: 'white' | 'black',
): { moments: ReviewMoment[]; clean: boolean } {
  const mine = moves.filter((m) => m.color === userColor)

  const errors = mine
    .filter((m) => m.classification !== 'best' && m.classification !== 'good')
    .sort((a, b) => b.winLoss - a.winLoss)
    .slice(0, MAX_MOMENTS)
  const moments: ReviewMoment[] = errors.map((move) => ({
    ply: move.ply,
    move,
    reason: move.classification as 'blunder' | 'mistake' | 'inaccuracy',
  }))

  if (moments.length < MIN_MOMENTS) {
    const picked = new Set(errors)
    const swings = mine
      .filter((m) => !picked.has(m))
      .sort((a, b) => swing(b) - swing(a))
      .slice(0, MIN_MOMENTS - moments.length)
    for (const move of swings) moments.push({ ply: move.ply, move, reason: 'swing' })
  }

  moments.sort((a, b) => a.ply - b.ply)
  return { moments, clean: errors.length === 0 }
}
