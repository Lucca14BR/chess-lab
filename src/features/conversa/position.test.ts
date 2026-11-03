import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { START_FEN } from '@/lib/chess/board';
import { fenSummary, positionStatus } from './position';

describe('fenSummary', () => {
  it('mostra a disposição das peças e quem joga', () => {
    expect(fenSummary(START_FEN)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR · brancas jogam');
    expect(fenSummary('8/8/8/8/8/8/8/K1k5 b - - 0 1')).toBe('8/8/8/8/8/8/8/K1k5 · pretas jogam');
  });
});

describe('positionStatus', () => {
  it('lado da vez, xeque e mate', () => {
    expect(positionStatus(new Chess())).toBe('Brancas jogam.');
    const mate = new Chess();
    for (const m of ['f3', 'e5', 'g4', 'Qh4#']) mate.move(m);
    expect(positionStatus(mate)).toBe('Xeque-mate. Pretas vencem.');
    expect(positionStatus(new Chess('4k3/8/8/8/8/8/8/4K2R b - - 0 1'))).toBe('Pretas jogam.');
    expect(positionStatus(new Chess('4k3/8/8/8/8/8/8/4R1K1 b - - 0 1'))).toBe('Pretas em xeque.');
  });
});
