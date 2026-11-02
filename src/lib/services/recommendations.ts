// Recomendações de estudo baseadas em regras transparentes sobre os dados reais do usuário.
import type { GameAnalysis, ImportedGame, LessonProgress, PuzzleAttempt, ActivityType } from '@/lib/db/schema';
import { statsBy, wdl } from '@/lib/stats/games';
import { weakestThemes } from '@/lib/stats/study';
import { CATEGORY_INFO } from '@/lib/puzzles';
import { LESSON_BY_ID, nextLessons } from './academy';
import type { PuzzleCategory } from '@/data/academy/types';

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  link: string;
  cta: string;
  activity: ActivityType;
  minutes: number;
  priority: number; // maior = mais importante
}

/** Famílias de abertura do Chess.com (inglês) -> aberturas da biblioteca. */
export const FAMILY_TO_OPENING: Record<string, string> = {
  'Italian Game': 'italiana',
  'Giuoco Piano': 'italiana',
  'Sicilian Defense': 'siciliana',
  'French Defense': 'francesa',
  'Ruy Lopez': 'ruy-lopez',
  'Ruy Lopez Opening': 'ruy-lopez',
  'Queens Gambit': 'gambito-da-dama',
  'Caro Kann Defense': 'caro-kann',
  'Slav Defense': 'eslava',
};

export function openingIdForFamily(family: string | null): string | null {
  if (!family) return null;
  if (FAMILY_TO_OPENING[family]) return FAMILY_TO_OPENING[family];
  const hit = Object.keys(FAMILY_TO_OPENING).find((k) => family.startsWith(k));
  return hit ? FAMILY_TO_OPENING[hit] : null;
}

export function buildRecommendations(input: { games: ImportedGame[]; attempts: PuzzleAttempt[]; lessons: LessonProgress[]; analyses?: GameAnalysis[]; now?: number }): Recommendation[] {
  const now = input.now ?? Date.now();
  const recs: Recommendation[] = [];
  const recent = input.games.filter((g) => g.rules === 'chess' && g.endTime > now - 180 * 86400_000);

  // 1. Tema tático mais fraco
  const weak = weakestThemes(input.attempts).filter((t) => t.accuracy < 70);
  if (weak[0]) {
    const t = weak[0];
    recs.push({
      id: `tema-${t.category}`,
      title: `Pratique ${CATEGORY_INFO[t.category].label.toLowerCase()}`,
      reason: `Sua taxa de acerto neste tema é ${t.accuracy}% em ${t.attempts} tentativas — a mais baixa entre os temas praticados.`,
      link: `/puzzles?tema=${t.category}`,
      cta: 'Abrir puzzles',
      activity: 'puzzles',
      minutes: 15,
      priority: 80 - t.accuracy / 2,
    });
  }

  // 2. Desequilíbrio entre cores
  const white = wdl(recent.filter((g) => g.userColor === 'white'));
  const black = wdl(recent.filter((g) => g.userColor === 'black'));
  if (white.total >= 15 && black.total >= 15 && Math.abs(white.score - black.score) >= 8) {
    const worse = white.score < black.score ? 'brancas' : 'pretas';
    recs.push({
      id: 'cor',
      title: `Reforce o repertório de ${worse}`,
      reason: `Nos últimos 6 meses você pontuou ${white.score}% com brancas e ${black.score}% com pretas.`,
      link: '/aberturas',
      cta: 'Ver aberturas',
      activity: 'abertura',
      minutes: 20,
      priority: 60 + Math.abs(white.score - black.score) / 2,
    });
  }

  // 3. Abertura problemática
  const fams = statsBy(recent, (g) => g.openingFamily).filter((s) => s.total >= 6 && s.score < 42);
  fams.sort((a, b) => a.score - b.score);
  if (fams[0]) {
    const f = fams[0];
    const oid = openingIdForFamily(f.key);
    recs.push({
      id: `abertura-${f.key}`,
      title: `Revise: ${f.key}`,
      reason: `Pontuação de ${f.score}% em ${f.total} partidas recentes nesta abertura (V ${f.win} · E ${f.draw} · D ${f.loss}).`,
      link: oid ? `/aberturas/${oid}` : `/desempenho?aba=aberturas`,
      cta: oid ? 'Estudar abertura' : 'Ver estatísticas',
      activity: 'abertura',
      minutes: 20,
      priority: 70 - f.score / 3,
    });
  }

  // 4. Derrotas por tempo
  const losses = recent.filter((g) => g.result === 'loss');
  const timeouts = losses.filter((g) => g.resultDetail === 'timeout').length;
  if (losses.length >= 10 && timeouts / losses.length >= 0.25) {
    recs.push({
      id: 'tempo',
      title: 'Trabalhe a gestão do relógio',
      reason: `${Math.round((timeouts / losses.length) * 100)}% das suas derrotas recentes foram por tempo (${timeouts} de ${losses.length}). Puzzles com tempo e partidas mais lentas ajudam.`,
      link: '/puzzles',
      cta: 'Treinar velocidade',
      activity: 'puzzles',
      minutes: 15,
      priority: 65,
    });
  }

  // 5. Erros graves frequentes nas análises
  const analyzed = (input.analyses ?? []).slice(-10);
  const calcLesson = [...LESSON_BY_ID.values()].filter((l) => l.category === 'planejamento').pop();
  if (analyzed.length >= 3) {
    const userBlunders = analyzed.reduce((s, a) => s + a.white.blunders + a.black.blunders, 0) / analyzed.length;
    if (userBlunders >= 2) {
      recs.push({
        id: 'blunders',
        title: 'Reduza os erros graves',
        reason: `As partidas analisadas têm em média ${userBlunders.toFixed(1)} erros graves (somando os dois lados). Faça a checagem de ameaças antes de cada lance.`,
        link: calcLesson ? `/academia/${calcLesson.id}` : '/puzzles?tema=defesa',
        cta: calcLesson ? 'Aula de cálculo' : 'Treinar defesa',
        activity: 'tatica',
        minutes: 20,
        priority: 62,
      });
    }
  }

  // 6. Sem puzzles na última semana
  const lastPuzzle = Math.max(0, ...input.attempts.map((a) => a.date));
  if (now - lastPuzzle > 7 * 86400_000) {
    recs.push({
      id: 'puzzles-semana',
      title: 'Retome os puzzles',
      reason: input.attempts.length ? 'Você não resolve puzzles há mais de uma semana. A tática melhora com prática frequente.' : 'Você ainda não resolveu puzzles. Comece pelo nível iniciante para calibrar.',
      link: '/puzzles',
      cta: 'Resolver puzzles',
      activity: 'puzzles',
      minutes: 15,
      priority: 50,
    });
  }

  // 7. Próxima aula
  const progress = new Map(input.lessons.map((l) => [l.lessonId, l]));
  const next = nextLessons(progress, 1)[0];
  if (next) {
    const started = progress.get(next.id)?.status === 'started';
    recs.push({
      id: `aula-${next.id}`,
      title: `${started ? 'Continue' : 'Comece'}: ${next.title}`,
      reason: started ? 'Esta aula está em andamento.' : 'Próxima aula disponível nas suas trilhas (pré-requisitos cumpridos).',
      link: `/academia/${next.id}`,
      cta: started ? 'Continuar aula' : 'Abrir aula',
      activity: 'aula',
      minutes: next.minutes,
      priority: started ? 58 : 45,
    });
  }

  return recs.sort((a, b) => b.priority - a.priority);
}

export function recommendedPuzzleCategories(attempts: PuzzleAttempt[]): PuzzleCategory[] {
  const weak = weakestThemes(attempts, 3).filter((t) => t.accuracy < 75).map((t) => t.category);
  const practiced = new Set(attempts.map((a) => a.category));
  const untried = (Object.keys(CATEGORY_INFO) as PuzzleCategory[]).filter((c) => !practiced.has(c));
  return [...weak, ...untried].slice(0, 3);
}
