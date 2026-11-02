import { findMoveTokens, isBareSquare, namesSquare, readMoves } from './moves'
import { factsMoves, factsPositions } from './facts'
import type { PositionFacts, Segment } from './types'

// Divide o texto da IA em trechos; lances citados são confirmados (legais e na ficha) ou "não verificados".
// Casa solta que não é lance confirmado (ex.: "a casa d4") fica como texto comum.
// Com várias fichas (revisão), o lance vale se uma delas o confirmar
export function verifyText(text: string, facts: PositionFacts | PositionFacts[]): Segment[] {
  const sheets = (Array.isArray(facts) ? facts : [facts]).map((f) => ({ positions: factsPositions(f), known: factsMoves(f) }))
  const segments: Segment[] = []
  // Junta texto seguido num trecho só
  const pushText = (t: string) => {
    if (!t) return
    const prev = segments[segments.length - 1]
    if (prev?.kind === 'text') prev.text += t
    else segments.push({ kind: 'text', text: t })
  }
  // Primeira leitura (PT ou EN) legal numa posição da ficha e presente nela
  const confirm = (raw: string): Segment | null => {
    for (const { positions, known } of sheets) {
      for (const fen of positions) {
        const read = readMoves(raw, fen).find((r) => known.has(r.san))
        if (read) return { kind: 'move', text: raw, san: read.san, uci: read.uci, fen }
      }
    }
    return null
  }
  let cursor = 0

  for (const token of findMoveTokens(text)) {
    pushText(text.slice(cursor, token.start))
    cursor = token.end
    const segment = namesSquare(text, token) ? null : confirm(token.raw)
    if (segment) segments.push(segment)
    else if (isBareSquare(token.raw)) pushText(token.raw)
    else segments.push({ kind: 'unverified', text: token.raw })
  }
  pushText(text.slice(cursor))
  return segments
}

// Tira Markdown que a IA escape a mandar: negrito, títulos e marcadores de lista (viram "•").
// startsLine = o texto começa uma linha (falso para um trecho no meio da linha)
export function plainText(text: string, startsLine = true): string {
  const lineStart = startsLine ? '(^|\\n)' : '(\\n)'
  return text
    .replace(/\*\*|__/g, '')
    .replace(new RegExp(`${lineStart}([ \\t]*)#{1,6}[ \\t]+`, 'g'), '$1$2')
    .replace(new RegExp(`${lineStart}([ \\t]*)[*-][ \\t]+`, 'g'), '$1$2• ')
}

// O mesmo para os trechos já conferidos (mensagens salvas antes do filtro)
export function plainSegments(segments: Segment[]): Segment[] {
  return segments.map((s, i) => {
    if (s.kind !== 'text') return s
    const startsLine = i === 0 || segments[i - 1].text.endsWith('\n')
    return { ...s, text: plainText(s.text, startsLine) }
  })
}
