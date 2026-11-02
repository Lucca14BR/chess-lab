import { describe, expect, it } from 'vitest'
import { START_FEN } from '@/lib/chess/board'
import { parsePgn } from '@/lib/chess/pgn'
import {
  MIN_THINK_MS,
  PLAY_LEVELS,
  applyMove,
  buildPlayPgn,
  canUndo,
  computerName,
  endHeadline,
  gameEnd,
  gameFen,
  isUserTurn,
  levelStrength,
  newGame,
  resign,
  resolveColor,
  startPositionError,
  undoPair,
  type PlayGame,
} from './game'

const play = (g: PlayGame, ...ucis: string[]): PlayGame => {
  let cur = g
  for (const u of ucis) {
    const next = applyMove(cur, u)
    if (!next) throw new Error(`lance ilegal: ${u}`)
    cur = next
  }
  return cur
}

describe('níveis', () => {
  it('8 níveis com a tabela combinada', () => {
    expect(PLAY_LEVELS.map((l) => [l.level, l.skill ?? null, l.elo ?? null, l.movetimeMs])).toEqual([
      [1, 0, null, 50],
      [2, 3, null, 100],
      [3, 6, null, 200],
      [4, 10, null, 300],
      [5, null, 1600, 500],
      [6, null, 1900, 700],
      [7, null, 2300, 1000],
      [8, 20, null, 1500],
    ])
    expect(PLAY_LEVELS.every((l) => l.label.length > 0)).toBe(true)
  })
  it('força enviada ao motor por nível', () => {
    expect(levelStrength(1)).toEqual({ skill: 0 })
    expect(levelStrength(6)).toEqual({ elo: 1900 })
    expect(levelStrength(8)).toEqual({ skill: 20 })
  })
  it('pausa mínima visível', () => {
    expect(MIN_THINK_MS).toBe(400)
  })
  it('nome do computador no PGN', () => {
    expect(computerName(5)).toBe('Stockfish nível 5')
  })
})

describe('cor', () => {
  it('sorteio devolve white ou black', () => {
    expect(resolveColor('random', () => 0.2)).toBe('white')
    expect(resolveColor('random', () => 0.8)).toBe('black')
    for (let i = 0; i < 20; i++) expect(['white', 'black']).toContain(resolveColor('random'))
  })
  it('cor escolhida é mantida', () => {
    expect(resolveColor('black', () => 0.1)).toBe('black')
    expect(resolveColor('white', () => 0.9)).toBe('white')
  })
})

describe('estado inicial', () => {
  it('posição inicial por padrão', () => {
    const g = newGame({ userColor: 'white', level: 3 })
    expect(g.startFen).toBe(START_FEN)
    expect(g.moves).toEqual([])
    expect(isUserTurn(g)).toBe(true)
    expect(gameEnd(g)).toBeNull()
  })
  it('a partir de uma FEN, com as pretas jogando a pessoa espera o computador', () => {
    const g = newGame({ userColor: 'black', level: 3, fen: START_FEN })
    expect(isUserTurn(g)).toBe(false)
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
    const g2 = newGame({ userColor: 'black', level: 3, fen: `  ${fen} ` })
    expect(g2.startFen).toBe(fen)
    expect(isUserTurn(g2)).toBe(false)
  })
  it('guarda a FEN normalizada (cabeçalho FEN canônico)', () => {
    const g = newGame({ userColor: 'white', level: 1, fen: '7k/8/5QK1/8/8/8/8/8   w  -  -  0   1' })
    expect(g.startFen).toBe('7k/8/5QK1/8/8/8/8/8 w - - 0 1')
    const g2 = newGame({ userColor: 'white', level: 1, fen: '7k/8/5QK1/8/8/8/8/8 w' })
    expect(g2.startFen).toBe('7k/8/5QK1/8/8/8/8/8 w - - 0 1')
    expect(parsePgn(buildPlayPgn(play(g2, 'f6f7'), { userName: '' })).headers.FEN).toBe('7k/8/5QK1/8/8/8/8/8 w - - 0 1')
  })
  it('valida a posição de partida', () => {
    expect(startPositionError(START_FEN)).toBeNull()
    expect(startPositionError('isto não é fen')).toMatch(/FEN inválida/)
    // Mate do pastor: posição já terminada
    expect(startPositionError('r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4')).toMatch(/terminada/)
  })
})

describe('lances', () => {
  it('aplica lances em UCI e recusa lance ilegal', () => {
    const g = play(newGame({ userColor: 'white', level: 1 }), 'e2e4')
    expect(g.moves.map((m) => m.san)).toEqual(['e4'])
    expect(isUserTurn(g)).toBe(false)
    expect(applyMove(g, 'e2e4')).toBeNull()
    expect(applyMove(g, 'xx')).toBeNull()
  })
  it('aceita promoção', () => {
    const g = play(newGame({ userColor: 'white', level: 1, fen: '7k/4P3/8/8/8/8/8/K7 w - - 0 1' }), 'e7e8q')
    expect(g.moves[0].san).toBe('e8=Q+')
  })
  it('não aceita lances depois do fim', () => {
    const g = play(newGame({ userColor: 'white', level: 1 }), 'f2f3', 'e7e5', 'g2g4', 'd8h4')
    expect(applyMove(g, 'a2a3')).toBeNull()
  })
})

describe('fim da partida', () => {
  it('xeque-mate', () => {
    const g = play(newGame({ userColor: 'white', level: 1 }), 'f2f3', 'e7e5', 'g2g4', 'd8h4')
    const end = gameEnd(g)
    expect(end).toMatchObject({ result: '0-1', winner: 'black', reason: 'checkmate' })
    expect(end?.text).toMatch(/Xeque-mate/)
    expect(endHeadline(end!, 'white')).toMatch(/computador venceu/)
    expect(endHeadline(end!, 'black')).toMatch(/Você venceu/)
  })
  it('afogamento', () => {
    const g = play(newGame({ userColor: 'white', level: 1, fen: '7k/8/5QK1/8/8/8/8/8 w - - 0 1' }), 'f6f7')
    expect(gameEnd(g)).toMatchObject({ result: '1/2-1/2', winner: null, reason: 'stalemate' })
    expect(gameEnd(g)?.text).toMatch(/afogamento/)
    expect(endHeadline(gameEnd(g)!, 'white')).toMatch(/Empate/)
  })
  it('material insuficiente', () => {
    const g = play(newGame({ userColor: 'white', level: 1, fen: '7k/8/8/8/8/8/1r6/K7 w - - 0 1' }), 'a1b2')
    expect(gameEnd(g)).toMatchObject({ result: '1/2-1/2', reason: 'insufficient' })
    expect(gameEnd(g)?.text).toMatch(/material insuficiente/)
  })
  it('tripla repetição', () => {
    const g = play(newGame({ userColor: 'white', level: 1 }), 'g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1')
    expect(gameEnd(g)).toBeNull()
    const g2 = play(g, 'f6g8')
    expect(gameEnd(g2)).toMatchObject({ result: '1/2-1/2', reason: 'threefold' })
    expect(gameEnd(g2)?.text).toMatch(/tripla repetição/)
  })
  it('regra dos 50 lances', () => {
    const g = play(newGame({ userColor: 'white', level: 1, fen: '7k/8/8/8/8/8/8/KR6 w - - 99 60' }), 'b1b2')
    expect(gameEnd(g)).toMatchObject({ result: '1/2-1/2', reason: 'fifty' })
    expect(gameEnd(g)?.text).toMatch(/50 lances/)
  })
  it('desistência', () => {
    const g = resign(play(newGame({ userColor: 'white', level: 2 }), 'e2e4'))
    expect(gameEnd(g)).toMatchObject({ result: '0-1', winner: 'black', reason: 'resign' })
    expect(endHeadline(gameEnd(g)!, 'white')).toMatch(/computador venceu/)
    const g2 = resign(newGame({ userColor: 'black', level: 2 }))
    expect(gameEnd(g2)).toMatchObject({ result: '1-0', winner: 'white' })
    expect(applyMove(g, 'e7e5')).toBeNull()
  })
})

describe('desfazer', () => {
  it('volta o lance da pessoa e a resposta do computador', () => {
    const g = play(newGame({ userColor: 'white', level: 1 }), 'e2e4', 'e7e5', 'g1f3', 'b8c6')
    const u = undoPair(g)
    expect(u.moves.map((m) => m.san)).toEqual(['e4', 'e5'])
    expect(isUserTurn(u)).toBe(true)
    expect(gameFen(u)).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2')
  })
  it('volta só um lance se o computador ainda não respondeu', () => {
    const g = play(newGame({ userColor: 'white', level: 1 }), 'e2e4', 'e7e5', 'g1f3')
    expect(undoPair(g).moves.map((m) => m.san)).toEqual(['e4', 'e5'])
  })
  it('com as pretas, não apaga o primeiro lance do computador', () => {
    const g = play(newGame({ userColor: 'black', level: 1 }), 'e2e4')
    expect(canUndo(g)).toBe(false)
    expect(undoPair(g)).toBe(g)
    const g2 = play(g, 'e7e5', 'g1f3')
    expect(canUndo(g2)).toBe(true)
    expect(undoPair(g2).moves.map((m) => m.san)).toEqual(['e4'])
  })
  it('sem lances seus, nada a desfazer', () => {
    const g = newGame({ userColor: 'white', level: 1 })
    expect(canUndo(g)).toBe(false)
    expect(undoPair(g)).toBe(g)
  })
})

describe('PGN', () => {
  it('cabeçalhos com nome, nível, resultado e data', () => {
    const g = play(newGame({ userColor: 'white', level: 4 }), 'f2f3', 'e7e5', 'g2g4', 'd8h4')
    const pgn = buildPlayPgn(g, { userName: 'Ana', date: new Date(2026, 10, 2) })
    const p = parsePgn(pgn)
    expect(p.headers).toMatchObject({ White: 'Ana', Black: 'Stockfish nível 4', Result: '0-1', Date: '2026.11.02' })
    expect(p.headers.FEN).toBeUndefined()
    expect(p.moves.map((m) => m.san)).toEqual(['f3', 'e5', 'g4', 'Qh4#'])
    expect(p.result).toBe('0-1')
  })
  it('sem nome, a pessoa aparece como "Você"; pretas trocam os lados', () => {
    const g = resign(newGame({ userColor: 'black', level: 7 }))
    const p = parsePgn(buildPlayPgn(g, { userName: '  ' }))
    expect(p.headers).toMatchObject({ White: 'Stockfish nível 7', Black: 'Você', Result: '1-0' })
  })
  it('com FEN/SetUp quando começa de uma posição', () => {
    const fen = '7k/8/5QK1/8/8/8/8/8 w - - 0 1'
    const g = play(newGame({ userColor: 'white', level: 3, fen }), 'f6f7')
    const p = parsePgn(buildPlayPgn(g, { userName: 'Ana' }))
    expect(p.headers).toMatchObject({ SetUp: '1', FEN: fen, Result: '1/2-1/2' })
    expect(p.moves.map((m) => m.san)).toEqual(['Qf7'])
  })
  it('partida em andamento sai com "*"', () => {
    const g = play(newGame({ userColor: 'white', level: 3 }), 'e2e4')
    expect(parsePgn(buildPlayPgn(g, { userName: '' })).headers.Result).toBe('*')
  })
})
