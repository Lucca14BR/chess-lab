import { describe, expect, it } from 'vitest'
import { ambientPatch, backgroundState } from './background'

const prefs = { musicEnabled: true, ambientType: 'heavy' as const, ambientThunder: true }
const off = { musicActive: false, ambientActive: false }
const on = { musicActive: true, ambientActive: true }

describe('backgroundState', () => {
  it('antes de ativar nesta visita, nada toca (mesmo com as preferências salvas)', () => {
    expect(backgroundState(prefs, off)).toEqual({ music: false, ambient: 'none', thunder: false })
  })
  it('ativado: segue as preferências', () => {
    expect(backgroundState(prefs, on)).toEqual({ music: true, ambient: 'heavy', thunder: true })
    expect(backgroundState({ ...prefs, musicEnabled: false }, on).music).toBe(false)
  })
  it('música e ambiente são independentes', () => {
    expect(backgroundState(prefs, { musicActive: true, ambientActive: false })).toEqual({ music: true, ambient: 'none', thunder: false })
  })
})

describe('ambientPatch', () => {
  it('ligando pela primeira vez, o que não aparecia na tela começa desligado', () => {
    // estava salvo "chuva pesada + trovões", mas a tela mostrava "nenhum": ligar só os trovões não traz a chuva junto
    expect(ambientPatch(off, { ambientThunder: true })).toEqual({ ambientType: 'none', ambientThunder: true })
    expect(ambientPatch(off, { ambientType: 'calm' })).toEqual({ ambientType: 'calm', ambientThunder: false })
  })
  it('já ativo: muda só o que foi pedido', () => {
    expect(ambientPatch(on, { ambientType: 'calm' })).toEqual({ ambientType: 'calm' })
    expect(ambientPatch(on, { ambientThunder: false })).toEqual({ ambientThunder: false })
  })
})
