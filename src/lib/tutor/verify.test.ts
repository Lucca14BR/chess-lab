import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { buildFacts } from './facts'
import { plainSegments, plainText, verifyText } from './verify'
import type { AnalysisResult } from '@/lib/engine/stockfish'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const AFTER_E4 = (() => {
  const c = new Chess(START)
  c.move('e4')
  return c.fen()
})()

function sheet(pv: string[]) {
  const engine: AnalysisResult = {
    fen: START,
    depth: 12,
    lines: [{ multipv: 1, depth: 12, cp: 30, mate: null, pv }],
    bestMove: pv[0],
  }
  return buildFacts({ fen: START, engine, played: null, asked: [] })
}

describe('verifyText', () => {
  const facts = sheet(['e2e4', 'e7e5'])

  it('lance da ficha vira move', () => {
    const segs = verifyText('Jogue e4.', facts)
    expect(segs).toEqual([
      { kind: 'text', text: 'Jogue ' },
      { kind: 'move', text: 'e4', san: 'e4', uci: 'e2e4', fen: START },
      { kind: 'text', text: '.' },
    ])
  })

  it('lance legal fora da ficha é não verificado', () => {
    const segs = verifyText('Cf3 também serve', facts)
    expect(segs[0]).toEqual({ kind: 'unverified', text: 'Cf3' })
  })

  it('lance ilegal é não verificado', () => {
    const segs = verifyText('Bb5 cravando', facts)
    expect(segs[0]).toEqual({ kind: 'unverified', text: 'Bb5' })
  })

  it('lance na linha da ficha vira move', () => {
    const f = sheet(['e2e4', 'e7e5', 'g1f3'])
    const segs = verifyText('depois de e4 e5, Cf3', f)
    const nf3 = segs.find((s) => s.kind === 'move' && s.san === 'Nf3')
    expect(nf3).toBeDefined()
    expect(nf3?.kind).toBe('move')
    // e5 só é legal depois de e4
    const e5 = segs.find((s) => s.kind === 'move' && s.san === 'e5')
    expect(e5).toMatchObject({ kind: 'move', uci: 'e7e5', fen: AFTER_E4 })
  })

  it('preserva o texto original', () => {
    const text = 'Depois de e4, e5; Cf3?! Bb5 e O-O.'
    const segs = verifyText(text, sheet(['e2e4', 'e7e5', 'g1f3']))
    expect(segs.map((s) => s.text).join('')).toBe(text)
  })

  it('texto sem lances é um único trecho', () => {
    expect(verifyText('Boa partida', facts)).toEqual([{ kind: 'text', text: 'Boa partida' }])
  })

  it('casas na prosa ficam como texto, mesmo legais e na ficha', () => {
    const text = 'O cavalo em f3 controla a casa d4 e a diagonal a2-g8; o peão de e5 avança.'
    expect(verifyText(text, facts)).toEqual([{ kind: 'text', text }])
    expect(verifyText('Ocupe a casa e5.', facts)).toEqual([{ kind: 'text', text: 'Ocupe a casa e5.' }])
  })

  it('casa solta fora da ficha não ganha aviso; só o lance com peça', () => {
    const segs = verifyText('ou a torre para e1 (Te1)', facts)
    expect(segs.filter((s) => s.kind === 'unverified').map((s) => s.text)).toEqual(['Te1'])
    expect(verifyText('d4 também serve', facts)).toEqual([{ kind: 'text', text: 'd4 também serve' }])
  })

  it('casa solta que é lance da ficha continua clicável', () => {
    const segs = verifyText('Depois de e4, e5 é natural.', facts)
    expect(segs.filter((s) => s.kind === 'move').map((s) => s.text)).toEqual(['e4', 'e5'])
  })

  it('R aceita as duas leituras: vale a que está na ficha (torre, não rei)', () => {
    // Rei f1 e torre a1: Ke1 e Re1 são legais; a ficha só tem a torre em e1
    const fen = '4k3/8/8/8/8/8/8/R4K2 w - - 0 1'
    const engine: AnalysisResult = { fen, depth: 12, lines: [{ multipv: 1, depth: 12, cp: 0, mate: null, pv: ['a1e1'] }], bestMove: 'a1e1' }
    const f = buildFacts({ fen, engine, played: null, asked: [] })
    expect(verifyText('Re1', f)).toEqual([{ kind: 'move', text: 'Re1', san: 'Re1+', uci: 'a1e1', fen }])
    expect(verifyText('Te1', f)[0]).toMatchObject({ kind: 'move', uci: 'a1e1' })
  })

  it('confere contra várias fichas', () => {
    const other = sheet(['g1f3'])
    const segs = verifyText('Cf3 e e4', [other, facts])
    expect(segs.filter((s) => s.kind === 'move').map((s) => s.text)).toEqual(['Cf3', 'e4'])
    expect(verifyText('Cf3', facts)[0].kind).toBe('unverified')
  })
})

describe('plainText', () => {
  it('tira negrito, títulos e troca marcadores de lista por •', () => {
    expect(plainText('## Plano\n**Ataque** no __rei__:\n* Cf3\n- e4\n  * d4')).toBe('Plano\nAtaque no rei:\n• Cf3\n• e4\n  • d4')
  })

  it('não mexe em hífen no meio da linha nem em avaliação negativa', () => {
    expect(plainText('Bom - mas -M3 e -1.20')).toBe('Bom - mas -M3 e -1.20')
    expect(plainText('-M3 para as pretas')).toBe('-M3 para as pretas')
  })

  it('trechos: marcador só conta no começo de linha', () => {
    const segs = plainSegments([
      { kind: 'text', text: '* **Jogue** ' },
      { kind: 'move', text: 'e4', san: 'e4', uci: 'e2e4', fen: START },
      { kind: 'text', text: ' - bom\n- depois' },
    ])
    expect(segs.map((s) => s.text)).toEqual(['• Jogue ', 'e4', ' - bom\n• depois'])
  })
})
