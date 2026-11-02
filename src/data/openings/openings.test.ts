import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { OPENINGS } from './index';

function play(fen: string | undefined, moves: string[]) {
  const chess = fen ? new Chess(fen) : new Chess();
  for (const san of moves) {
    // chess.js lança erro em lance ilegal
    chess.move(san);
  }
  return chess;
}

const split = (line: string) => line.trim().split(/\s+/).filter(Boolean);

describe('Aberturas', () => {
  it('inclui as aberturas pedidas', () => {
    const names = OPENINGS.map((o) => o.id);
    for (const id of ['italiana', 'siciliana', 'francesa', 'ruy-lopez', 'gambito-da-dama', 'caro-kann', 'eslava']) {
      expect(names).toContain(id);
    }
  });

  for (const o of OPENINGS) {
    it(`${o.id}: todas as linhas são legais`, () => {
      const all = [o.mainLine, ...o.lines.map((l) => l.moves), ...o.traps.map((t) => t.moves), ...o.keyPositions.map((k) => k.moves), ...o.mistakes.flatMap((m) => (m.moves ? [m.moves] : []))];
      for (const line of all) expect(() => play(undefined, split(line)), `${o.id}: ${line}`).not.toThrow();
      for (const l of o.lines) expect(split(l.moves).slice(0, 2).join(' '), `${o.id}: ${l.name} deve partir da linha principal`).toBe(split(o.mainLine).slice(0, 2).join(' '));
      expect(o.plansWhite.length).toBeGreaterThan(0);
      expect(o.plansBlack.length).toBeGreaterThan(0);
      expect(o.ideas.length).toBeGreaterThan(0);
    });
  }
});
