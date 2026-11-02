import { Chess } from 'chess.js'
import type { MoveMention } from './types'

// Candidatos a lance: roque ou SAN que termina em casa válida (letras de peça em PT e EN)
const TOKEN_RE =
  /\b(?:O-O(?:-O)?|0-0(?:-0)?|[KQRBNDTC]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBNDTC])?)[+#]?/g

// Letras de peça em português -> inglês (B é igual nos dois idiomas)
const PT_PARA_EN: Record<string, string> = { D: 'Q', T: 'R', C: 'N', R: 'K' }

export function findMoveTokens(text: string): Array<{ raw: string; start: number; end: number }> {
  const tokens: Array<{ raw: string; start: number; end: number }> = []
  for (const m of text.matchAll(TOKEN_RE)) {
    const raw = m[0]
    tokens.push({ raw, start: m.index, end: m.index + raw.length })
  }
  return tokens
}

// Leituras possíveis, em ordem de preferência: português, depois inglês
function readings(raw: string): string[] {
  const base = raw.replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O')
  const pt = base
    .replace(/^[DTCR]/, (c) => PT_PARA_EN[c])
    .replace(/=([DTCR])/, (_, c: string) => `=${PT_PARA_EN[c]}`)
  return pt === base ? [base] : [pt, base]
}

export function readMove(raw: string, fen: string): { san: string; uci: string } | null {
  for (const reading of readings(raw)) {
    try {
      const move = new Chess(fen).move(reading)
      return { san: move.san, uci: move.from + move.to + (move.promotion ?? '') }
    } catch {
      // leitura ilegal, tenta a próxima
    }
  }
  return null
}

export function findMoves(text: string, fen: string): MoveMention[] {
  const mentions: MoveMention[] = []
  for (const token of findMoveTokens(text)) {
    const read = readMove(token.raw, fen)
    if (read) mentions.push({ ...token, ...read })
  }
  return mentions
}
