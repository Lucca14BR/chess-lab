// Tipos da PubAPI do Chess.com (https://www.chess.com/news/view/published-data-api)

export interface ChessComProfile {
  '@id': string;
  url: string;
  username: string;
  player_id: number;
  title?: string;
  status: string;
  name?: string;
  avatar?: string;
  location?: string;
  country: string; // URL do país, ex.: https://api.chess.com/pub/country/BR
  joined: number; // segundos
  last_online: number; // segundos
  followers: number;
  is_streamer?: boolean;
  verified?: boolean;
  league?: string;
}

export interface ChessComRatingPoint {
  rating: number;
  date: number; // segundos
  rd?: number;
  game?: string;
}

export interface ChessComRecord {
  win: number;
  loss: number;
  draw: number;
  time_per_move?: number;
  timeout_percent?: number;
}

export interface ChessComModeStats {
  last?: ChessComRatingPoint;
  best?: ChessComRatingPoint;
  record?: ChessComRecord;
}

export interface ChessComStats {
  chess_bullet?: ChessComModeStats;
  chess_blitz?: ChessComModeStats;
  chess_rapid?: ChessComModeStats;
  chess_daily?: ChessComModeStats;
  chess960_daily?: ChessComModeStats;
  tactics?: { highest?: ChessComRatingPoint; lowest?: ChessComRatingPoint };
  puzzle_rush?: { best?: { total_attempts: number; score: number } };
  fide?: number;
}

export interface ChessComPlayerInGame {
  rating?: number;
  result: string;
  '@id': string;
  username: string;
  uuid?: string;
}

export interface ChessComGame {
  url: string;
  pgn?: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  uuid?: string;
  initial_setup?: string;
  fen?: string;
  time_class: string;
  rules: string;
  white: ChessComPlayerInGame;
  black: ChessComPlayerInGame;
  eco?: string;
  accuracies?: { white: number; black: number };
}

export interface ChessComArchives {
  archives: string[];
}

export interface ChessComMonthGames {
  games: ChessComGame[];
}
