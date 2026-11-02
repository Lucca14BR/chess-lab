import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { LESSONS, TRACKS } from './index';

function play(fen: string | undefined, moves: string[]) {
  const chess = fen ? new Chess(fen) : new Chess();
  for (const san of moves) {
    // chess.js lança erro em lance ilegal
    chess.move(san);
  }
  return chess;
}

const split = (line: string) => line.trim().split(/\s+/).filter(Boolean);

describe('Academia', () => {
  it('tem aulas e trilhas', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(16);
    expect(TRACKS.length).toBe(8);
  });

  it('IDs únicos e pré-requisitos existentes, sem ciclos', () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    expect(ids.size).toBe(LESSONS.length);
    for (const l of LESSONS) for (const r of l.requires) expect(ids.has(r), `${l.id} requer ${r}`).toBe(true);
    const byId = new Map(LESSONS.map((l) => [l.id, l]));
    const visit = (id: string, stack: string[]) => {
      expect(stack.includes(id), `ciclo: ${[...stack, id].join(' > ')}`).toBe(false);
      for (const r of byId.get(id)!.requires) visit(r, [...stack, id]);
    };
    for (const l of LESSONS) visit(l.id, []);
  });

  it('trilhas referenciam aulas existentes', () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    for (const t of TRACKS) for (const id of t.lessonIds) expect(ids.has(id), `${t.id}: ${id}`).toBe(true);
  });

  for (const lesson of LESSONS) {
    it(`aula ${lesson.id}: exemplos e exercícios legais`, () => {
      for (const s of lesson.sections) {
        if (!s.example) continue;
        expect(() => play(s.example!.fen, s.example!.moves ?? []), `${lesson.id} / ${s.example.title}`).not.toThrow();
      }
      expect(lesson.exercises.length).toBeGreaterThan(0);
      for (const ex of lesson.exercises) {
        expect(ex.solution.length % 2, `${ex.id}: solução deve terminar com lance do aluno`).toBe(1);
        let chess: Chess | undefined;
        expect(() => (chess = play(ex.fen, ex.solution)), `${ex.id}`).not.toThrow();
        if (ex.checkmate) expect(chess!.isCheckmate(), `${ex.id} deveria dar mate`).toBe(true);
      }
    });
  }
});

