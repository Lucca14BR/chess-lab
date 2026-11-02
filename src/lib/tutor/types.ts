// Tipos do tutor de IA
import type { AnalysisResult } from '@/lib/engine/stockfish'
import type { AnalyzedMove, MoveClass } from '@/lib/db/schema'

// Lance encontrado num texto; start/end são posições no texto original
export interface MoveMention {
  raw: string
  start: number
  end: number
  san: string
  uci: string
}

// Ficha de fatos: tudo o que a IA pode afirmar sobre a posição
// Linha do motor (até 8 lances)
export interface FactLine {
  san: string[]
  uci: string[]
  eval: string
}

export interface PlayedFact {
  san: string
  uci: string
  fenBefore: string
  evalBefore: string
  evalAfter: string
  winLoss: number
  classification: MoveClass
  bestSan: string
}

// reply = início da melhor resposta ao lance perguntado (SAN)
export interface AskedFact {
  san: string
  uci: string
  evalAfter: string
  reply: string[]
}

// piece em português: 'dama', 'torre', …
export interface PieceFact {
  square: string
  piece: string
  color: 'white' | 'black'
}

export interface PositionFacts {
  fen: string
  sideToMove: 'white' | 'black'
  gameOver: null | 'checkmate' | 'stalemate' | 'draw'
  inCheck: boolean
  legalMoveCount: number
  material: { white: number; black: number }
  bestLines: FactLine[]
  played: PlayedFact | null
  asked: AskedFact[]
  hanging: PieceFact[]
  checks: string[]
  captures: string[]
  mateInOne: string | null
}

export interface FactsInput {
  fen: string
  engine: AnalysisResult | null
  played: AnalyzedMove | null
  asked: Array<{ san: string; uci: string; engine: AnalysisResult | null }>
}
