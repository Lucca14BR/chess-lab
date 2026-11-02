import { afterEach, describe, expect, it, vi } from 'vitest'
import { strengthCommands } from './stockfish'

describe('strengthCommands', () => {
  it('sem força definida restaura a força total (análises)', () => {
    expect(strengthCommands()).toEqual(['setoption name Skill Level value 20', 'setoption name UCI_LimitStrength value false'])
  })
  it('com Skill Level, sem limite de Elo', () => {
    expect(strengthCommands({ skill: 3 })).toEqual(['setoption name Skill Level value 3', 'setoption name UCI_LimitStrength value false'])
  })
  it('com Elo, liga o limite e define o Elo (Skill Level fica em 20)', () => {
    expect(strengthCommands({ elo: 1900 })).toEqual([
      'setoption name Skill Level value 20',
      'setoption name UCI_LimitStrength value true',
      'setoption name UCI_Elo value 1900',
    ])
  })
  it('objeto vazio equivale a força total', () => {
    expect(strengthCommands({})).toEqual(['setoption name Skill Level value 20', 'setoption name UCI_LimitStrength value false'])
  })
})

// Worker falso: responde ao handshake UCI e devolve um bestmove a cada "go".
class FakeWorker {
  static sent: string[] = []
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  constructor(_url: string) {}
  postMessage(cmd: string) {
    FakeWorker.sent.push(cmd)
    const reply = (line: string) => setTimeout(() => this.onmessage?.({ data: line } as MessageEvent), 0)
    if (cmd === 'uci') reply('uciok')
    else if (cmd === 'isready') reply('readyok')
    else if (cmd.startsWith('go')) reply('bestmove e2e4')
  }
}

describe('engine: comandos enviados ao worker', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('cada job define a força: limitada no jogo, total na análise seguinte', async () => {
    FakeWorker.sent = []
    vi.stubGlobal('Worker', FakeWorker)
    const { engine } = await import('./stockfish')
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

    const r1 = await engine.analyze(fen, { movetimeMs: 50, strength: { elo: 1600 } })
    expect(r1.bestMove).toBe('e2e4')
    const job1 = FakeWorker.sent.slice(FakeWorker.sent.indexOf('ucinewgame'))
    expect(job1).toEqual([
      'ucinewgame',
      'setoption name Skill Level value 20',
      'setoption name UCI_LimitStrength value true',
      'setoption name UCI_Elo value 1600',
      'setoption name MultiPV value 1',
      `position fen ${fen}`,
      'go movetime 50',
    ])

    FakeWorker.sent = []
    await engine.analyze(fen, { depth: 10 })
    expect(FakeWorker.sent).toEqual([
      'ucinewgame',
      'setoption name Skill Level value 20',
      'setoption name UCI_LimitStrength value false',
      'setoption name MultiPV value 1',
      `position fen ${fen}`,
      'go depth 10',
    ])
  })
})
