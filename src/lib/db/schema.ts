import { Dexie, type EntityTable } from 'dexie';
import type { ChessComProfile, ChessComStats } from '@/lib/chesscom/types';
import type { PuzzleCategory, Level } from '@/data/academy/types';
import type { Segment } from '@/lib/tutor/types';

/* ------------------------------------------------------------------ */
/* Conta e dados importados do Chess.com (somente leitura na origem)   */
/* ------------------------------------------------------------------ */

export interface AccountRow {
  id: 'chesscom';
  username: string; // em minúsculas
  displayUsername: string;
  profile: ChessComProfile;
  stats: ChessComStats | null;
  connectedAt: number;
  importScope: ImportScope;
  lastProfileSyncAt: number | null;
  lastStatsSyncAt: number | null;
  lastGamesSyncAt: number | null;
  lastSyncError: string | null;
}

export type ImportScope = '3m' | '12m' | 'all';

export interface ArchiveRow {
  url: string;
  username: string;
  year: number;
  month: number;
  fetchedAt: number;
  gameCount: number;
  /** Mês já encerrado e baixado após o término: não precisa ser buscado de novo. */
  complete: boolean;
}

export type GameResult = 'win' | 'draw' | 'loss';
export type TimeClass = 'bullet' | 'blitz' | 'rapid' | 'daily';
export type Color = 'white' | 'black';

export interface PlayerSide {
  username: string;
  rating: number | null;
  result: string;
}

export interface ImportedGame {
  id: string; // uuid do Chess.com (ou URL quando ausente)
  username: string; // conta à qual pertence
  url: string;
  endTime: number; // ms
  timeClass: TimeClass;
  timeControl: string;
  rated: boolean;
  rules: string;
  white: PlayerSide;
  black: PlayerSide;
  userColor: Color;
  result: GameResult;
  resultDetail: string;
  userRating: number | null;
  opponentRating: number | null;
  opponent: string;
  eco: string | null;
  openingName: string | null;
  openingFamily: string | null;
  pgn: string;
  accuracies: { white: number; black: number } | null;
  archive: string; // YYYY/MM
}

/* ------------------------------------------------------------------ */
/* Dados próprios do Chess Lab                                         */
/* ------------------------------------------------------------------ */

export interface OwnGame {
  id: string;
  title: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  source: 'studio' | 'pgn-import' | 'play';
  /** Cor de quem usa, quando conhecida (partidas contra o computador). */
  userColor?: 'white' | 'black';
  createdAt: number;
  updatedAt: number;
}

export type MoveClass = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface AnalyzedMove {
  ply: number;
  san: string;
  uci: string;
  color: Color;
  fenBefore: string;
  evalBefore: number; // centipeões, ponto de vista das brancas (mate convertido)
  evalAfter: number;
  mateAfter: number | null;
  bestUci: string;
  bestSan: string;
  winLoss: number; // perda em % de chance de vitória para quem jogou
  classification: MoveClass;
}

export interface SideSummary {
  acpl: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  accuracy: number;
}

export interface GameAnalysis {
  id: string; // `${kind}:${gameId}`
  kind: 'chesscom' | 'own' | 'studio';
  gameId: string;
  title: string;
  depth: number;
  engine: string;
  createdAt: number;
  moves: AnalyzedMove[];
  white: SideSummary;
  black: SideSummary;
}

export interface SavedPosition {
  id: string;
  fen: string;
  name: string;
  notes: string;
  tags: string[];
  favorite: boolean;
  source: 'studio' | 'opening' | 'lesson' | 'puzzle' | 'notebook';
  createdAt: number;
}

export interface NoteRow {
  id: string;
  title: string;
  body: string;
  category: string;
  collectionIds: string[];
  tags: string[];
  fen: string | null;
  gameRef: { kind: 'chesscom' | 'own'; id: string; label: string } | null;
  favorite: boolean;
  isMistake: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CollectionRow {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface PuzzleAttempt {
  id: string;
  puzzleId: string;
  category: PuzzleCategory;
  level: Level;
  rating: number;
  solved: boolean;
  hintUsed: boolean;
  timeMs: number;
  points: number;
  date: number;
}

export interface PuzzleFavorite {
  puzzleId: string;
  addedAt: number;
}

export interface LessonProgress {
  lessonId: string;
  status: 'started' | 'completed';
  sectionsRead: number[];
  exercisesSolved: string[];
  startedAt: number;
  completedAt: number | null;
  updatedAt: number;
}

export interface RepertoireLine {
  moves: string; // SAN separado por espaço
  comment: string;
}

export interface RepertoireEntry {
  id: string;
  color: Color;
  name: string;
  openingId: string | null;
  lines: RepertoireLine[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

/** Comentários do usuário por posição (chave = FEN sem relógios). */
export interface OpeningNote {
  key: string;
  text: string;
  updatedAt: number;
}

export type ActivityType = 'puzzles' | 'abertura' | 'analise' | 'finais' | 'tatica' | 'aula' | 'partidas' | 'estrategia' | 'livre';

export interface SessionBlock {
  type: ActivityType;
  minutes: number;
  label: string;
  done: boolean;
  actualMs: number;
}

export interface TrainingSession {
  id: string;
  startedAt: number;
  endedAt: number;
  blocks: SessionBlock[];
  totalMs: number;
  status: 'completed' | 'partial';
  notes: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  blocks: Array<{ type: ActivityType; minutes: number; label: string }>;
  createdAt: number;
}

export interface PlannedActivity {
  id: string;
  day: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  type: ActivityType;
  title: string;
  minutes: number;
  done: boolean;
  createdAt: number;
}

export type GoalMetric = 'puzzles_solved' | 'lessons_completed' | 'study_minutes' | 'games_played' | 'sessions_completed' | 'manual';

export interface Goal {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  /** Semana (segunda, YYYY-MM-DD) ou 'recorrente' para todas as semanas. */
  week: string;
  manualProgress: Record<string, number>; // por semana
  active: boolean;
  createdAt: number;
}

export type ActivityKind = 'puzzle' | 'lesson' | 'session' | 'note' | 'sync' | 'analysis' | 'position' | 'opening' | 'game';

export interface ActivityLog {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  date: number;
  durationMs: number;
  /** Registrado enquanto uma sessão de treino cronometrada estava ativa (não somar duas vezes). */
  inSession: boolean;
  link: string | null;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

/** Mensagem da conversa com o tutor de IA (fio = revisão de partida ou posição). */
export interface TutorMessage {
  id: string;
  threadId: string;
  role: 'user' | 'tutor';
  text: string;
  segments: Segment[] | null;
  model: string | null;
  fen: string;
  createdAt: number;
  review?: {
    moments: Array<{ ply: number; title: string; explanation: Segment[]; whatToConsider: Segment[] }>;
    summary: Segment[];
    userColor: 'white' | 'black';
    clean: boolean;
  };
}

/** Segredos locais (ex.: chave do Gemini). Nunca entram no backup. */
export interface SecretRow {
  key: string;
  value: string;
}

export class ChessLabDB extends Dexie {
  declare account: EntityTable<AccountRow, 'id'>;
  declare archives: EntityTable<ArchiveRow, 'url'>;
  declare games: EntityTable<ImportedGame, 'id'>;
  declare ownGames: EntityTable<OwnGame, 'id'>;
  declare analyses: EntityTable<GameAnalysis, 'id'>;
  declare positions: EntityTable<SavedPosition, 'id'>;
  declare notes: EntityTable<NoteRow, 'id'>;
  declare collections: EntityTable<CollectionRow, 'id'>;
  declare puzzleAttempts: EntityTable<PuzzleAttempt, 'id'>;
  declare puzzleFavorites: EntityTable<PuzzleFavorite, 'puzzleId'>;
  declare lessonProgress: EntityTable<LessonProgress, 'lessonId'>;
  declare repertoire: EntityTable<RepertoireEntry, 'id'>;
  declare openingNotes: EntityTable<OpeningNote, 'key'>;
  declare sessions: EntityTable<TrainingSession, 'id'>;
  declare templates: EntityTable<SessionTemplate, 'id'>;
  declare planned: EntityTable<PlannedActivity, 'id'>;
  declare goals: EntityTable<Goal, 'id'>;
  declare activity: EntityTable<ActivityLog, 'id'>;
  declare settings: EntityTable<SettingRow, 'key'>;
  declare tutorMessages: EntityTable<TutorMessage, 'id'>;
  declare secrets: EntityTable<SecretRow, 'key'>;

  constructor(name = 'chess-lab') {
    super(name);
    this.version(1).stores({
      account: 'id',
      archives: 'url, username, [year+month]',
      games: 'id, username, endTime, timeClass, userColor, result, openingFamily, archive',
      ownGames: 'id, createdAt, updatedAt',
      analyses: 'id, kind, gameId, createdAt',
      positions: 'id, createdAt, favorite, source',
      notes: 'id, updatedAt, category, favorite, isMistake, *collectionIds, *tags',
      collections: 'id, name',
      puzzleAttempts: 'id, puzzleId, category, level, date, solved',
      puzzleFavorites: 'puzzleId, addedAt',
      lessonProgress: 'lessonId, status, updatedAt',
      repertoire: 'id, color, openingId, updatedAt',
      openingNotes: 'key',
      sessions: 'id, startedAt',
      templates: 'id, createdAt',
      planned: 'id, day, done',
      goals: 'id, week, active',
      activity: 'id, date, kind',
      settings: 'key',
    });
    // Versão 2: só as tabelas novas (o Dexie mantém as da versão 1)
    this.version(2).stores({
      tutorMessages: 'id, threadId, createdAt',
      secrets: 'key',
    });
  }
}

export const db = new ChessLabDB();
