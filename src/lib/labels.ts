import type { ActivityType, GameResult, GoalMetric } from '@/lib/db/schema';

export const RESULT_WORD: Record<GameResult, string> = { win: 'Vitória', draw: 'Empate', loss: 'Derrota' };

export const ACTIVITY_TYPES: Record<ActivityType, { label: string; link: string }> = {
  puzzles: { label: 'Puzzles', link: '/puzzles' },
  tatica: { label: 'Tática', link: '/academia' },
  abertura: { label: 'Aberturas', link: '/aberturas' },
  analise: { label: 'Análise de partidas', link: '/desempenho?aba=partidas' },
  finais: { label: 'Finais', link: '/academia' },
  estrategia: { label: 'Estratégia', link: '/academia' },
  aula: { label: 'Aula da Academia', link: '/academia' },
  partidas: { label: 'Jogar partidas', link: '/tabuleiro' },
  livre: { label: 'Estudo livre', link: '/caderno' },
};

export const GOAL_METRICS: Record<GoalMetric, { label: string; unit: string; auto: boolean }> = {
  puzzles_solved: { label: 'Puzzles resolvidos', unit: 'puzzles', auto: true },
  lessons_completed: { label: 'Aulas concluídas', unit: 'aulas', auto: true },
  study_minutes: { label: 'Minutos de estudo', unit: 'min', auto: true },
  sessions_completed: { label: 'Sessões de treino', unit: 'sessões', auto: true },
  games_played: { label: 'Partidas no Chess.com', unit: 'partidas', auto: true },
  manual: { label: 'Registro manual', unit: 'vezes', auto: false },
};
