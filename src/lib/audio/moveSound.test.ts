import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { moveSound, transitionSound } from './moveSound'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Aplica uma sequência de lances SAN a partir da posição dada e devolve a FEN final. */
function after(sans: string[], fen = START) {
  const c = new Chess(fen)
  for (const s of sans) c.move(s)
  return c.fen()
}

function soundOf(fen: string, san: string) {
  return moveSound(new Chess(fen).move(san))
}

describe('moveSound', () => {
  it('lance comum', () => {
    expect(soundOf(START, 'e4')).toBe('Move')
  })
  it('captura', () => {
    expect(soundOf(after(['e4', 'd5']), 'exd5')).toBe('Capture')
  })
  it('xeque', () => {
    expect(soundOf(after(['e4', 'd5']), 'Bb5+')).toBe('Check')
  })
  it('xeque com captura: o xeque tem prioridade', () => {
    expect(soundOf(after(['e4', 'e5', 'Bc4', 'Nc6']), 'Bxf7+')).toBe('Check')
  })
  it('roque é um lance comum', () => {
    expect(soundOf('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'O-O')).toBe('Move')
    expect(soundOf('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'O-O-O')).toBe('Move')
  })
  it('promoção sem captura', () => {
    expect(soundOf('8/P7/8/8/8/8/8/1k5K w - - 0 1', 'a8=Q')).toBe('Move')
  })
  it('promoção com captura', () => {
    expect(soundOf('1n6/P7/8/8/8/8/8/2k4K w - - 0 1', 'axb8=Q')).toBe('Capture')
  })
  it('promoção com xeque', () => {
    expect(soundOf('8/P7/8/8/8/8/8/k6K w - - 0 1', 'a8=Q+')).toBe('Check')
  })
  it('en passant é captura', () => {
    expect(soundOf('rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3', 'exf6')).toBe('Capture')
  })
})

describe('transitionSound', () => {
  it('um lance à frente: classifica o lance, navegando ou não', () => {
    const next = after(['e4'])
    expect(transitionSound(START, next, ['e2', 'e4'], false)).toBe('Move')
    expect(transitionSound(START, next, null, true)).toBe('Move')
    expect(transitionSound(after(['e4', 'd5']), after(['e4', 'd5', 'exd5']), null, false)).toBe('Capture')
  })
  it('mesma posição não toca', () => {
    expect(transitionSound(START, START, null, true)).toBeNull()
  })
  it('salto sem navegação (carregar partida, novo puzzle) não toca', () => {
    expect(transitionSound(START, after(['e4', 'd5', 'exd5']), ['e4', 'd5'], false)).toBeNull()
  })
  it('salto navegando: deduz a captura pela posição e pelo último lance', () => {
    expect(transitionSound(START, after(['e4', 'd5', 'exd5']), ['e4', 'd5'], true)).toBe('Capture')
    expect(transitionSound(START, after(['e4', 'd5', 'exd5', 'Qxd5']), ['d8', 'd5'], true)).toBe('Capture')
    expect(transitionSound(START, after(['e4', 'e5', 'Nf3']), ['g1', 'f3'], true)).toBe('Move')
  })
  it('salto navegando até um xeque', () => {
    expect(transitionSound(START, after(['e4', 'd5', 'Bb5+']), ['f1', 'b5'], true)).toBe('Check')
  })
  it('voltar um lance navegando toca o lance que ficou na tela', () => {
    expect(transitionSound(after(['e4', 'e5']), after(['e4']), ['e2', 'e4'], true)).toBe('Move')
  })
  it('salto navegando sem último lance (posição inicial) não toca', () => {
    expect(transitionSound(after(['e4', 'e5']), START, null, true)).toBeNull()
  })
  it('FEN anterior inválida não quebra', () => {
    expect(transitionSound('8/8/8/8/8/8/8/8 w - - 0 1', after(['e4']), ['e2', 'e4'], false)).toBeNull()
    expect(transitionSound('lixo', after(['e4']), ['e2', 'e4'], true)).toBe('Move')
  })
})
