import { describe, expect, it } from 'vitest'
import { THUNDER_TIMING, thunderDelayMs, thunderEnvelope, thunderStrike } from './thunder'

const RANDOMS = [0, 0.25, 0.5, 0.75, 0.9999]

describe('agendador de trovões', () => {
  it('intervalo normal fica dentro da faixa', () => {
    for (const r of RANDOMS) {
      const d = thunderDelayMs(() => r)
      expect(d).toBeGreaterThanOrEqual(THUNDER_TIMING.minMs)
      expect(d).toBeLessThanOrEqual(THUNDER_TIMING.maxMs)
    }
    expect(thunderDelayMs(() => 0)).toBe(THUNDER_TIMING.minMs)
  })
  it('o primeiro trovão vem mais cedo', () => {
    for (const r of RANDOMS) {
      const d = thunderDelayMs(() => r, true)
      expect(d).toBeGreaterThanOrEqual(THUNDER_TIMING.firstMinMs)
      expect(d).toBeLessThanOrEqual(THUNDER_TIMING.firstMaxMs)
    }
    expect(THUNDER_TIMING.firstMaxMs).toBeLessThan(THUNDER_TIMING.minMs)
  })
  it('parâmetros do estrondo ficam em faixas audíveis', () => {
    for (const r of RANDOMS) {
      const s = thunderStrike(() => r)
      expect(s.durationS).toBeGreaterThanOrEqual(3)
      expect(s.durationS).toBeLessThanOrEqual(9)
      expect(s.peak).toBeGreaterThan(0)
      expect(s.peak).toBeLessThanOrEqual(1)
      expect(s.cutoffHz).toBeGreaterThanOrEqual(80)
      expect(s.cutoffHz).toBeLessThanOrEqual(400)
      expect(Math.abs(s.pan)).toBeLessThanOrEqual(0.6)
      expect(s.rolls.length).toBeGreaterThanOrEqual(2)
      // rolagens em ordem, dentro da duração, mais fracas que o pico
      s.rolls.forEach((roll, i) => {
        expect(roll.atS).toBeGreaterThan(0)
        expect(roll.atS).toBeLessThan(s.durationS)
        expect(roll.level).toBeLessThanOrEqual(s.peak)
        if (i > 0) expect(roll.atS).toBeGreaterThan(s.rolls[i - 1].atS)
      })
    }
  })
  it('trovão perto estala; longe, só ronca', () => {
    expect(thunderStrike(() => 0).crack).toBe(true)
    expect(thunderStrike(() => 0.9999).crack).toBe(false)
  })
})

describe('envelope do trovão', () => {
  it('começa e termina em silêncio (sem estalos), sem passar do pico', () => {
    for (const r of RANDOMS) {
      const s = thunderStrike(() => r)
      const env = thunderEnvelope(s, 200)
      expect(env).toHaveLength(200)
      expect(env[0]).toBe(0)
      expect(env[env.length - 1]).toBe(0)
      expect(Math.max(...env)).toBeLessThanOrEqual(1)
      expect(Math.max(...env)).toBeGreaterThan(s.peak * 0.5)
      expect(env.every((v) => v >= 0 && Number.isFinite(v))).toBe(true)
    }
  })
  it('o estrondo principal vem no começo e a cauda decai', () => {
    const s = thunderStrike(() => 0.5)
    const env = thunderEnvelope(s, 400)
    const at = (t: number) => env[Math.round((t / s.durationS) * (env.length - 1))]
    const firstPeak = Math.max(...env.slice(0, Math.ceil(env.length * ((s.attackS + 0.3) / s.durationS))))
    expect(firstPeak).toBeGreaterThan(s.peak * 0.8)
    expect(at(s.durationS * 0.95)).toBeLessThan(firstPeak * 0.3)
  })
})
