import { describe, expect, it } from 'vitest';
import { buildPgn, cleanComment, flattenLines, parsePgn, replayMainline, splitPgn } from './pgn';
import { buildTree, findNode, treeToPgn } from './tree';
import { formatLine, pvToSan, validateFen } from './board';

describe('PGN', () => {
  const pgn = `[Event "Teste"]
[White "A"]
[Black "B"]
[Result "1-0"]

1. e4 {Abertura do rei [%clk 0:03:00]} e5 2. Nf3 (2. Bc4 Nf6 (2... Bc5) 3. d3) 2... Nc6 3. Bb5!? a6 $1 1-0`;

  it('lê cabeçalhos, comentários, NAGs e variações', () => {
    const g = parsePgn(pgn);
    expect(g.headers.White).toBe('A');
    expect(g.result).toBe('1-0');
    expect(g.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']);
    expect(g.moves[0].comment).toContain('Abertura do rei');
    expect(g.moves[2].variations).toHaveLength(1);
    expect(g.moves[2].variations[0].map((m) => m.san)).toEqual(['Bc4', 'Nf6', 'd3']);
    expect(g.moves[2].variations[0][1].variations[0][0].san).toBe('Bc5');
    expect(g.moves[4].nags).toEqual([5]);
    expect(g.moves[5].nags).toEqual([1]);
  });

  it('achata variações em linhas completas', () => {
    const lines = flattenLines(parsePgn(pgn).moves).map((l) => l.join(' '));
    expect(lines).toContain('e4 e5 Bc4 Nf6 d3');
    expect(lines).toContain('e4 e5 Bc4 Bc5');
    expect(lines).toContain('e4 e5 Nf3 Nc6 Bb5 a6');
    expect(lines).toHaveLength(3);
  });

  it('reproduz a linha principal e limpa comentários de relógio', () => {
    const r = replayMainline(parsePgn(pgn));
    expect(r.error).toBeNull();
    expect(r.moves).toHaveLength(6);
    expect(r.moves[0].comment).toBe('Abertura do rei');
    expect(cleanComment('[%clk 0:01:00] ótimo [%eval 0.3]')).toBe('ótimo');
  });

  it('reporta lance inválido', () => {
    const r = replayMainline(parsePgn('1. e4 e5 2. Ke3 *'));
    expect(r.error).toMatch(/Ke3/);
    expect(r.moves).toHaveLength(2);
  });

  it('divide arquivos com várias partidas', () => {
    const two = `[Event "1"]\n\n1. e4 *\n\n[Event "2"]\n\n1. d4 *`;
    expect(splitPgn(two)).toHaveLength(2);
  });

  it('gera PGN de ida e volta com comentários e FEN inicial', () => {
    const out = buildPgn({ moves: [{ san: 'e4', comment: 'bom' }, { san: 'e5' }, { san: 'Nf3' }], result: '*' });
    const back = parsePgn(out);
    expect(back.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3']);
    expect(back.moves[0].comment).toBe('bom');
    const fen = '4k3/8/8/8/8/8/4P3/4K3 b - - 0 10';
    const out2 = buildPgn({ startFen: fen, moves: [{ san: 'Kd7' }, { san: 'e4' }] });
    expect(out2).toContain('[FEN "4k3/8/8/8/8/8/4P3/4K3 b - - 0 10"]');
    expect(out2).toContain('10... Kd7 11. e4');
    expect(replayMainline(parsePgn(out2)).error).toBeNull();
  });
});

describe('Árvore de variantes', () => {
  it('mescla prefixos comuns e exporta PGN com variações válidas', () => {
    const tree = buildTree([
      { moves: ['e4', 'c5', 'Nf3', 'd6'], label: 'Najdorf' },
      { moves: ['e4', 'c5', 'Nf3', 'Nc6'], label: 'Clássica' },
      { moves: ['e4', 'c5', 'c3'], label: 'Alapin' },
    ]);
    expect(tree.children).toHaveLength(1);
    const c5 = findNode(tree, ['e4', 'c5'])!;
    expect(c5.children.map((c) => c.san)).toEqual(['Nf3', 'c3']);
    expect(findNode(tree, ['e4', 'c5', 'Nf3', 'd6'])!.labels).toEqual(['Najdorf']);
    const pgn = treeToPgn(tree);
    const lines = flattenLines(parsePgn(pgn).moves).map((l) => l.join(' '));
    expect(lines.sort()).toEqual(['e4 c5 Nf3 d6', 'e4 c5 Nf3 Nc6', 'e4 c5 c3'].sort());
  });
});

describe('Utilitários de tabuleiro', () => {
  it('valida FEN', () => {
    expect(validateFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBeNull();
    expect(validateFen('isto não é fen')).not.toBeNull();
  });
  it('converte PV UCI em SAN e formata a linha', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const sans = pvToSan(fen, ['e2e4', 'e7e5', 'g1f3']);
    expect(sans).toEqual(['e4', 'e5', 'Nf3']);
    expect(formatLine(fen, sans)).toBe('1. e4 e5 2. Nf3');
    expect(formatLine('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', ['e5'])).toBe('1... e5');
  });
});
