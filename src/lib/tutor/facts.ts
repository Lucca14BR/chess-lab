import { Chess } from 'chess.js'
import type { Color, PieceSymbol } from 'chess.js'
import { formatEval } from '@/lib/engine/stockfish'
import type { AnalysisResult } from '@/lib/engine/stockfish'
import { pvToSan } from '@/lib/chess/board'
import type { AskedFact, FactLine, FactsInput, PieceFact, PositionFacts } from './types'

const MAX_LINE = 8 // lances por linha do motor
const MAX_REPLY = 4 // lances da resposta a um lance perguntado

const NOMES: Record<PieceSymbol, string> = {
  p: 'peão',
  n: 'cavalo',
  b: 'bispo',
  r: 'torre',
  q: 'dama',
  k: 'rei',
}
const VALOR: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const MATE_CP = 9000 // a partir daqui o centipeão é um mate convertido (10000 - 10 × lances)

// Avaliação salva em centipeões (mate convertido) como texto: "+0.35", "M3", "-M3"
export function evalText(cp: number, mate: number | null): string {
  if (mate == null && Math.abs(cp) >= MATE_CP) mate = Math.sign(cp) * Math.round((10000 - Math.abs(cp)) / 10)
  return formatEval({ cp, mate })
}

const cor = (c: Color): 'white' | 'black' => (c === 'w' ? 'white' : 'black')

// Joga um lance UCI e devolve a FEN resultante (null se ilegal)
function fenAfter(fen: string, uci: string): string | null {
  try {
    const c = new Chess(fen)
    c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return c.fen()
  } catch {
    return null
  }
}

// FEN depois de cada lance UCI da sequência (para quando um lance é ilegal)
function fensAlong(fen: string, uciMoves: string[]): string[] {
  const out: string[] = []
  let cur = fen
  for (const uci of uciMoves) {
    const next = fenAfter(cur, uci)
    if (!next) break
    out.push(next)
    cur = next
  }
  return out
}

function factLines(fen: string, engine: AnalysisResult | null): FactLine[] {
  const out: FactLine[] = []
  for (const l of engine?.lines ?? []) {
    const san = pvToSan(fen, l.pv, MAX_LINE)
    if (!san.length) continue
    out.push({ san, uci: l.pv.slice(0, san.length), eval: formatEval(l) })
  }
  return out
}

function askedFacts(fen: string, input: FactsInput['asked']): AskedFact[] {
  return input.map((a) => {
    const after = fenAfter(fen, a.uci)
    const pv = a.engine?.lines[0]?.pv ?? []
    return {
      san: a.san,
      uci: a.uci,
      evalAfter: formatEval(a.engine?.lines[0]),
      reply: after ? pvToSan(after, pv, MAX_REPLY) : [],
    }
  })
}

// Peças (de qualquer cor) atacadas pelo adversário e sem defensor
// Limitação: `attackers` ignora cravadas e defensores em raio-X (ex.: torre atrás de torre)
function hangingPieces(chess: Chess): PieceFact[] {
  const out: PieceFact[] = []
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq || sq.type === 'k') continue
      const enemy: Color = sq.color === 'w' ? 'b' : 'w'
      if (chess.attackers(sq.square, enemy).length === 0) continue
      if (chess.attackers(sq.square, sq.color).length > 0) continue
      out.push({ square: sq.square, piece: NOMES[sq.type], color: cor(sq.color) })
    }
  }
  return out
}

function material(chess: Chess): { white: number; black: number } {
  const m = { white: 0, black: 0 }
  for (const row of chess.board()) {
    for (const sq of row) if (sq) m[cor(sq.color)] += VALOR[sq.type]
  }
  return m
}

export function buildFacts(input: FactsInput): PositionFacts {
  const { fen, engine, played, asked } = input
  const chess = new Chess(fen)
  const moves = chess.moves({ verbose: true })
  const gameOver = chess.isCheckmate()
    ? 'checkmate'
    : chess.isStalemate()
      ? 'stalemate'
      : chess.isDraw()
        ? 'draw'
        : null
  return {
    fen,
    sideToMove: cor(chess.turn()),
    gameOver,
    inCheck: chess.inCheck(),
    legalMoveCount: moves.length,
    material: material(chess),
    bestLines: factLines(fen, engine),
    played: played && {
      san: played.san,
      uci: played.uci,
      fenBefore: played.fenBefore,
      evalBefore: evalText(played.evalBefore, null),
      evalAfter: evalText(played.evalAfter, played.mateAfter),
      winLoss: played.winLoss,
      classification: played.classification,
      bestSan: played.bestSan,
    },
    asked: askedFacts(fen, asked),
    hanging: hangingPieces(chess),
    checks: moves.filter((m) => /[+#]$/.test(m.san)).map((m) => m.san),
    captures: moves.filter((m) => m.isCapture()).map((m) => m.san),
    mateInOne: moves.find((m) => m.san.endsWith('#'))?.san ?? null,
  }
}

// Todas as FEN que a ficha cobre (usada pela conferência de lances citados)
export function factsPositions(f: PositionFacts): string[] {
  const out = new Set<string>([f.fen])
  for (const l of f.bestLines) for (const x of fensAlong(f.fen, l.uci)) out.add(x)
  if (f.played) {
    out.add(f.played.fenBefore)
    for (const x of fensAlong(f.played.fenBefore, [f.played.uci])) out.add(x)
  }
  for (const a of f.asked) {
    const along = fensAlong(f.fen, [a.uci])
    for (const x of along) out.add(x)
    // posições ao longo da resposta
    let cur = along[0]
    for (const san of a.reply) {
      if (!cur) break
      try {
        const c = new Chess(cur)
        c.move(san)
        cur = c.fen()
        out.add(cur)
      } catch {
        break
      }
    }
  }
  return [...out]
}

// Todos os lances (SAN) presentes na ficha
export function factsMoves(f: PositionFacts): Set<string> {
  const out = new Set<string>()
  for (const l of f.bestLines) for (const s of l.san) out.add(s)
  if (f.played) {
    out.add(f.played.san)
    out.add(f.played.bestSan)
  }
  for (const a of f.asked) {
    out.add(a.san)
    for (const s of a.reply) out.add(s)
  }
  for (const s of f.checks) out.add(s)
  for (const s of f.captures) out.add(s)
  if (f.mateInOne) out.add(f.mateInOne)
  return out
}
