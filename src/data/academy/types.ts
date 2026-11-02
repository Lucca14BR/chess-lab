export type Level = 'iniciante' | 'intermediario' | 'avancado';

export type AcademyCategory =
  | 'fundamentos'
  | 'aberturas'
  | 'tatica'
  | 'estrategia'
  | 'meio-jogo'
  | 'finais'
  | 'planejamento'
  | 'analise';

/** Categorias da Sala de Puzzles (ver public/data/puzzles.json). */
export type PuzzleCategory =
  | 'garfo'
  | 'cravada'
  | 'ataqueDescoberto'
  | 'espeto'
  | 'desvio'
  | 'ataqueDuplo'
  | 'sacrificio'
  | 'xequeMate'
  | 'combinacao'
  | 'defesa';

export interface BoardArrow {
  from: string; // casa, ex.: "e2"
  to: string;
  brush?: 'green' | 'red' | 'blue' | 'yellow';
}

export interface LessonExample {
  title: string;
  fen: string;
  /** Lances em SAN jogados a partir de `fen`, mostrados passo a passo. */
  moves?: string[];
  caption: string;
  orientation?: 'white' | 'black';
  arrows?: BoardArrow[];
}

export interface LessonExercise {
  id: string;
  prompt: string;
  fen: string;
  /**
   * Sequência em SAN a partir de `fen`. Índices pares são lances do aluno,
   * ímpares são respostas automáticas do adversário. Sempre termina com lance do aluno.
   */
  solution: string[];
  explanation: string;
  /** Quando true, o último lance da solução deve dar xeque-mate (validado em teste). */
  checkmate?: boolean;
}

export interface LessonSection {
  heading: string;
  paragraphs: string[];
  example?: LessonExample;
}

export interface Lesson {
  id: string;
  trackId: string;
  category: AcademyCategory;
  title: string;
  description: string;
  level: Level;
  minutes: number;
  /** IDs de aulas que devem ser concluídas antes. */
  requires: string[];
  sections: LessonSection[];
  exercises: LessonExercise[];
  keyPoints: string[];
  /** Tema da Sala de Puzzles recomendado para praticar após a aula. */
  practiceTheme?: PuzzleCategory;
}

export interface Track {
  id: string;
  category: AcademyCategory;
  title: string;
  description: string;
  lessonIds: string[];
}
