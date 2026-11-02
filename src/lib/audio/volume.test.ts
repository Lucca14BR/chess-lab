import { describe, expect, it } from 'vitest'
import { clamp01, effectiveVolume } from './volume'

describe('volumes', () => {
  it('clamp01 limita entre 0 e 1', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(0.3)).toBe(0.3)
    expect(clamp01(1.7)).toBe(1)
    expect(clamp01(Number.NaN)).toBe(0)
  })
  it('volume efetivo = geral × específico', () => {
    expect(effectiveVolume(0.8, 0.5)).toBeCloseTo(0.4)
    expect(effectiveVolume(1, 1)).toBe(1)
    expect(effectiveVolume(0, 1)).toBe(0)
  })
  it('valores fora da faixa são limitados antes de multiplicar', () => {
    expect(effectiveVolume(2, 0.5)).toBeCloseTo(0.5)
    expect(effectiveVolume(0.5, -1)).toBe(0)
    expect(effectiveVolume(3, 3)).toBe(1)
  })
})
