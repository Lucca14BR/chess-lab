import { Chess } from 'chess.js'
import type { MoveMention } from './types'

// Candidatos a lance: roque ou SAN que termina em casa válida (letras de peça em PT e EN).
// Não pode estar colado a letra, dígito ou hífen (evita palavras e faixas como a2-g8)
const TOKEN_RE =
  /(?<![\p{L}\d-])(?:O-O(?:-O)?|0-0(?:-0)?|[KQRBNDTC]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBNDTC])?)[+#]?(?![\p{L}\d-])/gu

// Palavras que, logo antes de uma casa solta, indicam que o texto fala da casa ("a casa e5", "o cavalo em f3")
const SQUARE_WORDS = /(?:^|[^\p{L}])(?:casas?|em|de|para|nas?|nos?|das?|dos?)\s+$/iu
// …exceto "depois de", "antes de", "em vez de" e "além de", que introduzem lances
const MOVE_DE = /(?:depois|antes|vez|além)\s+de\s+$/iu

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

// Casa solta: sem peça, captura, promoção, xeque ou roque (ex.: "e4")
export const isBareSquare = (raw: string): boolean => /^[a-h][1-8]$/.test(raw)

// Casa solta que, pelo contexto, é o nome de uma casa e não um lance
export function namesSquare(text: string, token: { raw: string; start: number }): boolean {
  if (!isBareSquare(token.raw)) return false
  const before = text.slice(Math.max(0, token.start - 30), token.start)
  return SQUARE_WORDS.test(before) && !MOVE_DE.test(before)
}

// Leituras possíveis, em ordem de preferência: português, depois inglês
function readings(raw: string): string[] {
  const base = raw.replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O')
  const pt = base
    .replace(/^[DTCR]/, (c) => PT_PARA_EN[c])
    .replace(/=([DTCR])/, (_, c: string) => `=${PT_PARA_EN[c]}`)
  return pt === base ? [base] : [pt, base]
}

// Todas as leituras legais na posição, na ordem de preferência
export function readMoves(raw: string, fen: string): Array<{ san: string; uci: string }> {
  const out: Array<{ san: string; uci: string }> = []
  for (const reading of readings(raw)) {
    try {
      const move = new Chess(fen).move(reading)
      out.push({ san: move.san, uci: move.from + move.to + (move.promotion ?? '') })
    } catch {
      // leitura ilegal, tenta a próxima
    }
  }
  return out
}

export function readMove(raw: string, fen: string): { san: string; uci: string } | null {
  return readMoves(raw, fen)[0] ?? null
}

export function findMoves(text: string, fen: string): MoveMention[] {
  const mentions: MoveMention[] = []
  for (const token of findMoveTokens(text)) {
    if (namesSquare(text, token)) continue
    const read = readMove(token.raw, fen)
    if (read) mentions.push({ ...token, ...read })
  }
  return mentions
}
