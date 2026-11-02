import { describe, expect, it } from 'vitest';
import type { ImportedGame, PuzzleAttempt, TrainingSession, ActivityLog, Goal } from '@/lib/db/schema';
import { filterGames, monthly, ratingSeries, statsBy, wdl, ratingDelta, currentStreak } from './games';
import { goalProgress, puzzlePoints, studyStreak, studyTimeByDay, weakestThemes } from './study';
import { classify, moveAccuracy, summarize } from '@/lib/engine/gameAnalysis';
import { parseInfo, winChance } from '@/lib/engine/stockfish';
import { isoDay } from '@/lib/utils';

function g(p: Partial<ImportedGame>): ImportedGame {
  return {
    id: Math.random().toString(36),
    username: 'eu',
    url: '',
    endTime: Date.UTC(2026, 9, 1, 12),
    timeClass: 'blitz',
    timeControl: '180',
    rated: true,
    rules: 'chess',
    white: { username: 'eu', rating: 1500, result: 'win' },
    black: { username: 'x', rating: 1500, result: 'resigned' },
    userColor: 'white',
    result: 'win',
    resultDetail: 'resigned',
    userRating: 1500,
    opponentRating: 1500,
    opponent: 'x',
    eco: null,
    openingName: null,
    openingFamily: null,
    pgn: '',
    accuracies: null,
    archive: '2026/10',
    ...p,
  };
}

describe('estatísticas de partidas', () => {
  it('calcula V/E/D e pontuação', () => {
    const w = wdl([g({ result: 'win' }), g({ result: 'draw' }), g({ result: 'loss' }), g({ result: 'win' })]);
    expect(w).toMatchObject({ win: 2, draw: 1, loss: 1, total: 4, score: 62.5 });
  });

  it('nunca mistura controles de tempo na série de rating', () => {
    const day = 86400_000;
    const base = Date.UTC(2026, 0, 1);
    const games = [g({ timeClass: 'blitz', userRating: 1500, endTime: base }), g({ timeClass: 'rapid', userRating: 1800, endTime: base + day }), g({ timeClass: 'blitz', userRating: 1520, endTime: base + 2 * day }), g({ timeClass: 'blitz', userRating: 1530, endTime: base + 2 * day + 1000 })];
    const s = ratingSeries(games, 'blitz');
    expect(s.map((p) => p.rating)).toEqual([1500, 1530]); // último do dia
    expect(ratingSeries(games, 'rapid').map((p) => p.rating)).toEqual([1800]);
    expect(ratingDelta(s, base + day)).toBe(30);
  });

  it('ignora partidas não ranqueadas e variantes na série', () => {
    const s = ratingSeries([g({ rated: false, userRating: 1000 }), g({ rules: 'chess960', userRating: 900 })], 'blitz');
    expect(s).toHaveLength(0);
  });

  it('filtra por período, cor e modalidade', () => {
    const now = Date.UTC(2026, 10, 1);
    const games = [g({ endTime: now - 10 * 86400_000, userColor: 'black' }), g({ endTime: now - 100 * 86400_000 }), g({ endTime: now - 5 * 86400_000, timeClass: 'rapid' })];
    expect(filterGames(games, { period: '30d', now })).toHaveLength(2);
    expect(filterGames(games, { period: '30d', color: 'black', now })).toHaveLength(1);
    expect(filterGames(games, { period: 'all', timeClass: 'rapid', now })).toHaveLength(1);
  });

  it('agrupa por mês e por chave', () => {
    const games = [g({ endTime: new Date(2026, 0, 5).getTime() }), g({ endTime: new Date(2026, 0, 20).getTime(), result: 'loss' }), g({ endTime: new Date(2026, 1, 2).getTime() })];
    const m = monthly(games);
    expect(m.map((x) => x.month)).toEqual(['2026-01', '2026-02']);
    expect(m[0]).toMatchObject({ win: 1, loss: 1 });
    expect(statsBy(games, (x) => x.result)[0]).toMatchObject({ key: 'win', total: 2 });
    expect(currentStreak(games)).toEqual({ result: 'win', count: 1 });
  });
});

describe('estatísticas de estudo', () => {
  const att = (p: Partial<PuzzleAttempt>): PuzzleAttempt => ({ id: Math.random().toString(), puzzleId: 'p', category: 'garfo', level: 'iniciante', rating: 1200, solved: true, hintUsed: false, timeMs: 30000, points: 12, date: Date.now(), ...p });

  it('encontra temas fracos com amostra mínima', () => {
    const attempts = [...Array(4)].map((_, i) => att({ category: 'cravada', solved: i === 0 })).concat([...Array(4)].map(() => att({ category: 'garfo' }))).concat([att({ category: 'espeto', solved: false })]);
    const weak = weakestThemes(attempts);
    expect(weak[0].category).toBe('cravada');
    expect(weak[0].accuracy).toBe(25);
    expect(weak.find((w) => w.category === 'espeto')).toBeUndefined();
  });

  it('pontua puzzles e penaliza dica', () => {
    expect(puzzlePoints(1500, true, false)).toBe(15);
    expect(puzzlePoints(1500, true, true)).toBe(8);
    expect(puzzlePoints(1500, false, false)).toBe(0);
  });

  it('não conta em dobro o tempo registrado durante sessão', () => {
    const day = new Date(2026, 9, 10, 10).getTime();
    const sessions: TrainingSession[] = [{ id: 's', startedAt: day, endedAt: day + 1, blocks: [], totalMs: 20 * 60000, status: 'completed', notes: '' }];
    const activity: ActivityLog[] = [
      { id: 'a', kind: 'puzzle', title: '', detail: '', date: day, durationMs: 5 * 60000, inSession: true, link: null },
      { id: 'b', kind: 'puzzle', title: '', detail: '', date: day, durationMs: 3 * 60000, inSession: false, link: null },
    ];
    const d = studyTimeByDay(sessions, activity)[0];
    expect(d.sessions).toBe(20 * 60000);
    expect(d.puzzles).toBe(3 * 60000);
  });

  it('calcula sequência de dias', () => {
    const today = new Date(2026, 9, 10);
    const days = new Set([isoDay(new Date(2026, 9, 9)), isoDay(new Date(2026, 9, 8)), isoDay(new Date(2026, 9, 6))]);
    expect(studyStreak(days, today)).toBe(2);
  });

  it('progresso de metas automáticas e manuais', () => {
    const week = '2026-10-05';
    const inWeek = new Date(2026, 9, 7).getTime();
    const goal: Goal = { id: 'g', title: '', metric: 'puzzles_solved', target: 5, week, manualProgress: {}, active: true, createdAt: 0 };
    const input = { attempts: [att({ date: inWeek }), att({ date: inWeek, solved: false }), att({ date: new Date(2026, 9, 20).getTime() })], lessons: [], sessions: [], activity: [], gamesInWeek: 3 };
    expect(goalProgress(goal, week, input)).toBe(1);
    expect(goalProgress({ ...goal, metric: 'games_played' }, week, input)).toBe(3);
    expect(goalProgress({ ...goal, metric: 'manual', manualProgress: { [week]: 4 } }, week, input)).toBe(4);
  });
});

describe('motor e análise', () => {
  it('converte a avaliação para o ponto de vista das brancas', () => {
    const l = parseInfo('info depth 12 seldepth 18 multipv 1 score cp 35 nodes 1 pv e7e5 g1f3', false)!;
    expect(l.cp).toBe(-35);
    expect(l.pv).toEqual(['e7e5', 'g1f3']);
    const m = parseInfo('info depth 20 multipv 2 score mate -3 pv a1a2', true)!;
    expect(m.mate).toBe(-3);
    expect(m.multipv).toBe(2);
    expect(parseInfo('info string NNUE', true)).toBeNull();
  });

  it('classifica lances pela perda de chance de vitória', () => {
    expect(winChance(0)).toBeCloseTo(50);
    expect(classify(5, false)).toBe('good');
    expect(classify(12, false)).toBe('inaccuracy');
    expect(classify(25, false)).toBe('mistake');
    expect(classify(40, false)).toBe('blunder');
    expect(classify(40, true)).toBe('best');
    expect(moveAccuracy(0)).toBeCloseTo(100, 0);
  });

  it('resume a precisão por lado', () => {
    const base = { ply: 1, san: 'e4', uci: 'e2e4', fenBefore: '', mateAfter: null, bestUci: '', bestSan: '' };
    const s = summarize(
      [
        { ...base, color: 'white', evalBefore: 20, evalAfter: 20, winLoss: 0, classification: 'best' },
        { ...base, color: 'white', evalBefore: 20, evalAfter: -300, winLoss: 30, classification: 'blunder' },
        { ...base, color: 'black', evalBefore: 0, evalAfter: 0, winLoss: 0, classification: 'good' },
      ],
      'white',
    );
    expect(s.blunders).toBe(1);
    expect(s.acpl).toBe(160);
    expect(s.accuracy).toBeLessThan(100);
  });
});
