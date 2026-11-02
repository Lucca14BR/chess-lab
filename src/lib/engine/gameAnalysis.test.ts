import { describe, expect, it } from 'vitest'
import type { AnalyzedMove, GameAnalysis } from '@/lib/db/schema'
import { analysisMatches } from './gameAnalysis'

const move = (uci: string): AnalyzedMove => ({
  ply: 1, san: uci, uci, color: 'white', fenBefore: '', evalBefore: 0, evalAfter: 0, mateAfter: null,
  bestUci: uci, bestSan: uci, winLoss: 0, classification: 'best',
})

const side = { acpl: 0, inaccuracies: 0, mistakes: 0, blunders: 0, accuracy: 100 }
const analysis = (ucis: string[]): GameAnalysis => ({
  id: 'own:1', kind: 'own', gameId: '1', title: 't', depth: 10, engine: 'sf', createdAt: 0,
  moves: ucis.map(move), white: side, black: side,
})

describe('analysisMatches', () => {
  it('sem análise não corresponde', () => {
    expect(analysisMatches(null, [{ uci: 'e2e4' }])).toBe(false)
  })
  it('mesmos lances correspondem', () => {
    expect(analysisMatches(analysis(['e2e4', 'e7e5']), [{ uci: 'e2e4' }, { uci: 'e7e5' }])).toBe(true)
  })
  it('número diferente de lances não corresponde', () => {
    expect(analysisMatches(analysis(['e2e4', 'e7e5']), [{ uci: 'e2e4' }])).toBe(false)
  })
  it('mesmo número com outro lance não corresponde', () => {
    expect(analysisMatches(analysis(['e2e4', 'e7e5']), [{ uci: 'e2e4' }, { uci: 'c7c5' }])).toBe(false)
  })
})
