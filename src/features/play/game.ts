// Partida contra o computador: lógica pura (sem React nem motor), para testar à parte.
import { Chess } from 'chess.js';
import { START_FEN, validateFen } from '@/lib/chess/board';
import { buildPgn } from '@/lib/chess/pgn';
import type { EngineStrength } from '@/lib/engine/stockfish';

export type Color = 'white' | 'black';
export type ColorChoice = Color | 'random';

export interface PlayLevel {
  level: number;
  /** Skill Level do Stockfish (0–20). */
  skill?: number;
  /** Elo alvo (UCI_LimitStrength). */
  elo?: number;
  /** Profundidade máxima da busca (níveis fracos). */
  depth?: number;
  /** Tempo de reflexão por lance (níveis fortes). */
  movetimeMs?: number;
  /** Chance (0–1) de jogar um lance legal qualquer no lugar do lance do motor. */
  slip: number;
  /** Descrição curta para a tela. */
  label: string;
}

// Mesmo no Skill Level 0 o Stockfish quase nunca entrega peças; por isso os níveis fracos
// também limitam a profundidade e, de vez em quando, "deslizam" para um lance qualquer.
// O UCI_Elo do Stockfish começa em 1320, então só os níveis 5–7 usam Elo.
export const PLAY_LEVELS: PlayLevel[] = [
  { level: 1, skill: 0, depth: 1, slip: 0.35, label: 'Bem fraco: entrega peças com frequência' },
  { level: 2, skill: 0, depth: 2, slip: 0.2, label: 'Fraco: ainda deixa peças escaparem' },
  { level: 3, skill: 2, depth: 3, slip: 0.1, label: 'Iniciante: comete erros de vez em quando' },
  { level: 4, skill: 5, depth: 5, slip: 0.05, label: 'Intermediário: erra pouco, mas erra' },
  { level: 5, elo: 1400, movetimeMs: 300, slip: 0, label: 'Clube, por volta de 1400' },
  { level: 6, elo: 1700, movetimeMs: 500, slip: 0, label: 'Forte, por volta de 1700' },
  { level: 7, elo: 2100, movetimeMs: 800, slip: 0, label: 'Avançado, por volta de 2100' },
  { level: 8, skill: 20, movetimeMs: 1500, slip: 0, label: 'Muito forte: o Stockfish com tudo' },
];

/** Pausa mínima antes de mostrar o lance do computador (para não parecer instantâneo). */
export const MIN_THINK_MS = 400;

export function levelInfo(level: number): PlayLevel {
  return PLAY_LEVELS.find((l) => l.level === level) ?? PLAY_LEVELS[0];
}

/** Força enviada ao motor para o nível. */
export function levelStrength(level: number): EngineStrength {
  const l = levelInfo(level);
  return l.elo != null ? { elo: l.elo } : { skill: l.skill ?? 20 };
}

/** Limite da busca para o nível: profundidade nos fracos, tempo nos fortes. */
export function levelSearch(level: number): { depth: number } | { movetimeMs: number } {
  const l = levelInfo(level);
  return l.depth != null ? { depth: l.depth } : { movetimeMs: l.movetimeMs ?? 1000 };
}

/** Com chance `slip`, troca o lance do motor por outro lance legal (deslize dos níveis fracos). */
export function pickComputerMove(legal: string[], engineMove: string, slip: number, rng: () => number = Math.random): string {
  const others = legal.filter((m) => m !== engineMove);
  if (!others.length || rng() >= slip) return engineMove;
  return others[Math.floor(rng() * others.length) % others.length];
}

export function computerName(level: number): string {
  return `Stockfish nível ${level}`;
}

export function resolveColor(choice: ColorChoice, rand: () => number = Math.random): Color {
  if (choice !== 'random') return choice;
  return rand() < 0.5 ? 'white' : 'black';
}

export interface PlayMove {
  san: string;
  uci: string;
  from: string;
  to: string;
  color: 'w' | 'b';
}

export interface PlayGame {
  startFen: string;
  userColor: Color;
  level: number;
  moves: PlayMove[];
  resigned: boolean;
}

export type EndReason = 'checkmate' | 'stalemate' | 'insufficient' | 'threefold' | 'fifty' | 'resign';

export interface GameEnd {
  result: '1-0' | '0-1' | '1/2-1/2';
  winner: Color | null;
  reason: EndReason;
  /** Motivo em português, para a tela. */
  text: string;
}

/** Mensagem de erro se a posição não serve para começar (FEN inválida ou partida já terminada). */
export function startPositionError(fen: string): string | null {
  const err = validateFen(fen);
  if (err) return err;
  if (new Chess(fen.trim()).isGameOver()) return 'Essa posição já está terminada (mate ou empate). Escolha outra para jogar.';
  return null;
}

export function newGame(opts: { userColor: Color; level: number; fen?: string }): PlayGame {
  // FEN normalizada pelo chess.js (espaços, campos faltando), para o cabeçalho FEN do PGN sair canônico.
  const startFen = opts.fen?.trim() ? new Chess(opts.fen.trim()).fen() : START_FEN;
  return { startFen, userColor: opts.userColor, level: opts.level, moves: [], resigned: false };
}

/** Reproduz a partida desde o início (o histórico é necessário para a tripla repetição). */
export function replay(g: PlayGame): Chess {
  const c = new Chess(g.startFen);
  for (const m of g.moves) c.move({ from: m.from, to: m.to, promotion: m.uci[4] });
  return c;
}

export function gameFen(g: PlayGame): string {
  return replay(g).fen();
}

const colorOf = (c: Chess): Color => (c.turn() === 'w' ? 'white' : 'black');

export function sideToMove(g: PlayGame): Color {
  return colorOf(replay(g));
}

export function isUserTurn(g: PlayGame): boolean {
  return sideToMove(g) === g.userColor;
}

function endOf(g: PlayGame, c: Chess): GameEnd | null {
  if (g.resigned) {
    const winner: Color = g.userColor === 'white' ? 'black' : 'white';
    return { result: winner === 'white' ? '1-0' : '0-1', winner, reason: 'resign', text: 'Você desistiu.' };
  }
  if (c.isCheckmate()) {
    const winner: Color = colorOf(c) === 'white' ? 'black' : 'white';
    return { result: winner === 'white' ? '1-0' : '0-1', winner, reason: 'checkmate', text: `Xeque-mate. ${winner === 'white' ? 'As brancas' : 'As pretas'} vencem.` };
  }
  const draw = (reason: EndReason, text: string): GameEnd => ({ result: '1/2-1/2', winner: null, reason, text });
  if (c.isStalemate()) return draw('stalemate', 'Empate por afogamento: quem tinha a vez não tem lance legal e não está em xeque.');
  if (c.isInsufficientMaterial()) return draw('insufficient', 'Empate por material insuficiente: ninguém consegue dar mate.');
  if (c.isThreefoldRepetition()) return draw('threefold', 'Empate por tripla repetição da mesma posição.');
  if (c.isDrawByFiftyMoves()) return draw('fifty', 'Empate pela regra dos 50 lances, sem captura nem lance de peão.');
  return null;
}

export function gameEnd(g: PlayGame): GameEnd | null {
  return endOf(g, replay(g));
}

/** Título do resultado do ponto de vista da pessoa. */
export function endHeadline(end: GameEnd, userColor: Color): string {
  if (!end.winner) return 'Empate';
  return end.winner === userColor ? 'Você venceu!' : 'O computador venceu desta vez';
}

/** Aplica um lance (UCI, ex. "e2e4" ou "e7e8q"). Devolve null se for ilegal ou se a partida já acabou. */
export function applyMove(g: PlayGame, uci: string): PlayGame | null {
  const c = replay(g);
  if (endOf(g, c)) return null;
  try {
    const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return { ...g, moves: [...g.moves, { san: m.san, uci: m.from + m.to + (m.promotion ?? ''), from: m.from, to: m.to, color: m.color }] };
  } catch {
    return null;
  }
}

const userCode = (g: PlayGame) => (g.userColor === 'white' ? 'w' : 'b');

export function canUndo(g: PlayGame): boolean {
  return g.moves.some((m) => m.color === userCode(g));
}

/** Volta o último lance da pessoa e, se houver, a resposta do computador depois dele. */
export function undoPair(g: PlayGame): PlayGame {
  if (!canUndo(g)) return g;
  const moves = [...g.moves];
  while (moves.length) {
    const m = moves.pop()!;
    if (m.color === userCode(g)) break;
  }
  return { ...g, moves };
}

export function resign(g: PlayGame): PlayGame {
  return { ...g, resigned: true };
}

const pgnDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

export function buildPlayPgn(g: PlayGame, opts: { userName: string; date?: Date }): string {
  const you = opts.userName.trim() || 'Você';
  const cpu = computerName(g.level);
  const result = gameEnd(g)?.result ?? '*';
  return buildPgn({
    headers: {
      Event: 'Partida contra o computador',
      Date: pgnDate(opts.date ?? new Date()),
      White: g.userColor === 'white' ? you : cpu,
      Black: g.userColor === 'black' ? you : cpu,
      Result: result,
    },
    startFen: g.startFen,
    moves: g.moves.map((m) => ({ san: m.san })),
    result,
  });
}
