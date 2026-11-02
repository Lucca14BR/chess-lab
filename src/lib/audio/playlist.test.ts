import { describe, expect, it } from 'vitest'
import { nextTrackId, trackAfterRemoval } from './playlist'

const ids = ['a', 'b', 'c']

describe('nextTrackId', () => {
  it('lista vazia: nenhuma faixa', () => {
    expect(nextTrackId([], null, false)).toBeNull()
    expect(nextTrackId([], 'a', true)).toBeNull()
  })
  it('em ordem: a próxima, voltando ao início no fim', () => {
    expect(nextTrackId(ids, 'a', false)).toBe('b')
    expect(nextTrackId(ids, 'c', false)).toBe('a')
  })
  it('sem faixa atual: começa pela primeira', () => {
    expect(nextTrackId(ids, null, false)).toBe('a')
    expect(nextTrackId(ids, 'sumiu', false)).toBe('a')
  })
  it('aleatório nunca repete a atual', () => {
    for (const r of [0, 0.2, 0.5, 0.7, 0.9999]) {
      const next = nextTrackId(ids, 'b', true, () => r)
      expect(next).not.toBe('b')
      expect(ids).toContain(next)
    }
  })
  it('aleatório usa o sorteio para escolher entre as outras', () => {
    expect(nextTrackId(ids, 'b', true, () => 0)).toBe('a')
    expect(nextTrackId(ids, 'b', true, () => 0.99)).toBe('c')
  })
  it('aleatório sem faixa atual sorteia qualquer uma', () => {
    expect(nextTrackId(ids, null, true, () => 0.99)).toBe('c')
  })
  it('uma faixa só: repete ela mesma', () => {
    expect(nextTrackId(['a'], 'a', true, () => 0.5)).toBe('a')
    expect(nextTrackId(['a'], 'a', false)).toBe('a')
  })
})

describe('trackAfterRemoval', () => {
  it('a faixa atual continua: nada muda', () => {
    expect(trackAfterRemoval(ids, ['a', 'b'], 'b')).toBe('b')
  })
  it('removeu a atual: passa para a seguinte', () => {
    expect(trackAfterRemoval(ids, ['a', 'c'], 'b')).toBe('c')
  })
  it('removeu a última atual: volta para a primeira que restou', () => {
    expect(trackAfterRemoval(ids, ['a', 'b'], 'c')).toBe('a')
  })
  it('removeu várias, inclusive a atual', () => {
    expect(trackAfterRemoval(['a', 'b', 'c', 'd'], ['a', 'd'], 'b')).toBe('d')
  })
  it('lista ficou vazia', () => {
    expect(trackAfterRemoval(ids, [], 'a')).toBeNull()
  })
  it('sem faixa atual', () => {
    expect(trackAfterRemoval(ids, ['a'], null)).toBeNull()
  })
})
