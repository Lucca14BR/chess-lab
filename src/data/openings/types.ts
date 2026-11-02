/** Lances em SAN separados por espaço, a partir da posição inicial, sem números. Ex.: "e4 e5 Nf3 Nc6" */
export type SanLine = string;

export interface OpeningLine {
  name: string;
  moves: SanLine;
  comment: string;
}

export interface OpeningTrap {
  name: string;
  moves: SanLine;
  /** Lado que se beneficia da armadilha. */
  beneficiary: 'white' | 'black';
  explanation: string;
}

export interface OpeningMistake {
  title: string;
  moves?: SanLine;
  explanation: string;
}

export interface OpeningKeyPosition {
  title: string;
  moves: SanLine;
  explanation: string;
}

export interface Opening {
  id: string;
  name: string;
  eco: string[];
  /** Lado que escolhe a abertura (para quem ela entra no repertório). */
  side: 'white' | 'black';
  mainLine: SanLine;
  summary: string;
  /** Ideias centrais: por que a abertura funciona. */
  ideas: string[];
  plansWhite: string[];
  plansBlack: string[];
  /** Perfil de jogador para quem ela é indicada, com a justificativa. */
  suitability: string;
  lines: OpeningLine[];
  traps: OpeningTrap[];
  mistakes: OpeningMistake[];
  keyPositions: OpeningKeyPosition[];
}
