import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { START_FEN as START } from '@/lib/chess/board'
import { findMoves, findMoveTokens, readMove } from './moves'

// Dama d1, torre a1 e rei e1 brancos: Qh5, Rb1 e Ke2 são legais
const FEN_PECAS = '2k5/8/8/8/8/8/8/R2QK3 w - - 0 1'
// Rei e1 e torre a2: ambos chegam a e2
const FEN_AMBIGUO = '2k5/8/8/8/8/8/R7/4K3 w - - 0 1'
// Roque dos dois lados disponível
const FEN_ROQUE = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
// Peão branco prestes a promover
const FEN_PROMOCAO = '8/P7/8/7k/8/8/8/4K3 w - - 0 1'

function legais(fen: string, san: string) {
  const chess = new Chess(fen)
  return chess.moves().includes(san)
}

describe('fixtures', () => {
  it('as posições têm os lances esperados', () => {
    expect(legais(FEN_PECAS, 'Qh5')).toBe(true)
    expect(legais(FEN_PECAS, 'Rb1')).toBe(true)
    expect(legais(FEN_PECAS, 'Ke2')).toBe(true)
    expect(legais(FEN_AMBIGUO, 'Ke2')).toBe(true)
    expect(legais(FEN_AMBIGUO, 'Re2')).toBe(true)
    expect(legais(FEN_ROQUE, 'O-O')).toBe(true)
  })
})

describe('findMoves', () => {
  it('lê SAN em inglês', () => {
    const r = findMoves('e se Nf3?', START)
    expect(r.map((m) => ({ san: m.san, uci: m.uci }))).toEqual([{ san: 'Nf3', uci: 'g1f3' }])
    expect(r[0].raw).toBe('Nf3')
    expect('e se Nf3?'.slice(r[0].start, r[0].end)).toBe('Nf3')
  })

  it('lê SAN em português', () => {
    const r = findMoves('e se Cf3 ou Cc3?', START)
    expect(r.map((m) => m.san)).toEqual(['Nf3', 'Nc3'])
  })

  it('casa depois de "em", "para", "casa"… não é lance', () => {
    expect(findMoves('o cavalo vai para f3? e a casa e4? e o peão em d4?', START)).toEqual([])
    expect(findMoves('e se f3?', START).map((m) => m.san)).toEqual(['f3'])
  })

  it('ignora lances ilegais', () => {
    expect(findMoves('a ideia é e5 com Bb5', START)).toEqual([])
    const tokens = findMoveTokens('a ideia é e5 com Bb5')
    expect(tokens.map((t) => t.raw)).toEqual(['e5', 'Bb5'])
    for (const t of tokens) {
      expect('a ideia é e5 com Bb5'.slice(t.start, t.end)).toBe(t.raw)
    }
  })
})

describe('findMoveTokens', () => {
  it('não confunde texto comum', () => {
    expect(findMoveTokens('De fato, a torre')).toEqual([])
  })

  it('faixas e palavras coladas não viram lance', () => {
    expect(findMoveTokens('a diagonal a2-g8')).toEqual([])
    expect(findMoveTokens('e4é f3d')).toEqual([])
  })

  it('acha roque e lances com sufixo', () => {
    const raws = findMoveTokens('Jogue O-O e depois Qh5+ ou 0-0-0').map((t) => t.raw)
    expect(raws).toEqual(['O-O', 'Qh5+', '0-0-0'])
  })
})

describe('readMove', () => {
  it('D = dama, T = torre, R = rei em português', () => {
    expect(readMove('Dh5', FEN_PECAS)?.san).toBe('Qh5')
    expect(readMove('Tb1', FEN_PECAS)?.san).toBe('Rb1')
    expect(readMove('Re2', FEN_PECAS)?.san).toBe('Ke2')
  })

  it('R ambíguo prefere a leitura em português quando as duas são legais', () => {
    expect(readMove('Re2', FEN_AMBIGUO)?.san).toBe('Ke2')
  })

  it('cai na leitura em inglês quando a portuguesa é ilegal', () => {
    // Ka8 é impossível, então vale Ra2-a8+
    expect(readMove('Ra8+', FEN_AMBIGUO)?.san).toBe('Ra8+')
  })

  it('roques', () => {
    expect(readMove('O-O', FEN_ROQUE)).toEqual({ san: 'O-O', uci: 'e1g1' })
    expect(readMove('0-0', FEN_ROQUE)?.san).toBe('O-O')
    expect(readMove('0-0-0', FEN_ROQUE)?.san).toBe('O-O-O')
    expect(readMove('O-O', START)).toBeNull()
  })

  it('promoção em português e inglês', () => {
    expect(readMove('a8=D', FEN_PROMOCAO)).toEqual({ san: 'a8=Q', uci: 'a7a8q' })
    expect(readMove('a8=T', FEN_PROMOCAO)?.san).toBe('a8=R')
    expect(readMove('a8=C', FEN_PROMOCAO)?.san).toBe('a8=N')
    expect(readMove('a8=Q', FEN_PROMOCAO)?.san).toBe('a8=Q')
  })

  it('devolve null para lance ilegal ou lixo', () => {
    expect(readMove('e5', START)).toBeNull()
    expect(readMove('xyz', START)).toBeNull()
    expect(readMove('Nf3', 'fen inválido')).toBeNull()
  })
})
