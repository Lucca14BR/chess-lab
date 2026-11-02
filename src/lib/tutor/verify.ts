import { findMoveTokens, isBareSquare, namesSquare, readMove } from './moves'
import { factsMoves, factsPositions } from './facts'
import type { PositionFacts, Segment } from './types'

// Divide o texto da IA em trechos; lances citados são confirmados (legais e na ficha) ou "não verificados".
// Casa solta que não é lance confirmado (ex.: "a casa d4") fica como texto comum
export function verifyText(text: string, facts: PositionFacts): Segment[] {
  const positions = factsPositions(facts)
  const known = factsMoves(facts)
  const segments: Segment[] = []
  // Junta texto seguido num trecho só
  const pushText = (t: string) => {
    if (!t) return
    const prev = segments[segments.length - 1]
    if (prev?.kind === 'text') prev.text += t
    else segments.push({ kind: 'text', text: t })
  }
  let cursor = 0

  for (const token of findMoveTokens(text)) {
    pushText(text.slice(cursor, token.start))
    cursor = token.end
    let segment: Segment | null = null
    if (!namesSquare(text, token)) {
      for (const fen of positions) {
        const read = readMove(token.raw, fen)
        if (read && known.has(read.san)) {
          segment = { kind: 'move', text: token.raw, san: read.san, uci: read.uci, fen }
          break
        }
      }
    }
    if (segment) segments.push(segment)
    else if (isBareSquare(token.raw)) pushText(token.raw)
    else segments.push({ kind: 'unverified', text: token.raw })
  }
  pushText(text.slice(cursor))
  return segments
}
