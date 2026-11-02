import { findMoveTokens, readMove } from './moves'
import { factsMoves, factsPositions } from './facts'
import type { PositionFacts, Segment } from './types'

// Divide o texto da IA em trechos; lances citados são confirmados (legais e na ficha) ou "não verificados"
export function verifyText(text: string, facts: PositionFacts): Segment[] {
  const positions = factsPositions(facts)
  const known = factsMoves(facts)
  const segments: Segment[] = []
  let cursor = 0

  for (const token of findMoveTokens(text)) {
    if (token.start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, token.start) })
    let segment: Segment = { kind: 'unverified', text: token.raw }
    for (const fen of positions) {
      const read = readMove(token.raw, fen)
      if (read && known.has(read.san)) {
        segment = { kind: 'move', text: token.raw, san: read.san, uci: read.uci, fen }
        break
      }
    }
    segments.push(segment)
    cursor = token.end
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) })
  return segments
}
