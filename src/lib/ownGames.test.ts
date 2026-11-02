import { describe, expect, it } from 'vitest'
import type { OwnGame } from '@/lib/db/schema'
import { ownGameRecord } from './ownGames'

const played: OwnGame = {
  id: 'g1', title: 'Contra o computador, nível 3', pgn: '1. e4 *', white: 'Ana', black: 'Stockfish nível 3',
  result: '*', source: 'play', userColor: 'black', createdAt: 100, updatedAt: 100,
}

describe('ownGameRecord', () => {
  it('nova partida do Tabuleiro', () => {
    const r = ownGameRecord(undefined, { id: 'n1', title: 'T', pgn: 'p', white: 'W', black: 'B', result: '1-0' }, 500)
    expect(r).toEqual({ id: 'n1', title: 'T', pgn: 'p', white: 'W', black: 'B', result: '1-0', source: 'studio', createdAt: 500, updatedAt: 500 })
  })
  it('ao editar, mantém origem, cor e data de criação', () => {
    const r = ownGameRecord(played, { id: 'g1', title: 'Revisada', pgn: '1. e4 e5 *', white: 'Ana', black: 'Stockfish nível 3', result: '*' }, 900)
    expect(r).toEqual({ ...played, title: 'Revisada', pgn: '1. e4 e5 *', updatedAt: 900 })
    expect(r.source).toBe('play')
    expect(r.userColor).toBe('black')
    expect(r.createdAt).toBe(100)
  })
})
