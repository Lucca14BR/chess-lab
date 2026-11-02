import type { Lesson, Track } from './types';
import { fundamentos } from './lessons/fundamentos';
import { aberturas } from './lessons/aberturas';
import { tatica } from './lessons/tatica';
import { estrategia } from './lessons/estrategia';
import { meioJogo } from './lessons/meioJogo';
import { finais } from './lessons/finais';
import { planejamento } from './lessons/planejamento';
import { analise } from './lessons/analise';

export const LESSONS: Lesson[] = [
  ...fundamentos,
  ...aberturas,
  ...tatica,
  ...estrategia,
  ...meioJogo,
  ...finais,
  ...planejamento,
  ...analise,
];

const ids = (list: Lesson[]) => list.map((l) => l.id);

export const TRACKS: Track[] = [
  {
    id: 'trilha-fundamentos',
    category: 'fundamentos',
    title: 'Fundamentos',
    description:
      'As regras, o valor das peças, o xeque-mate e os princípios que orientam os primeiros lances. O ponto de partida de toda a Academia.',
    lessonIds: ids(fundamentos),
  },
  {
    id: 'trilha-aberturas',
    category: 'aberturas',
    title: 'Aberturas',
    description:
      'Tempos, estruturas centrais e um método para construir e revisar um repertório coerente com o seu estilo.',
    lessonIds: ids(aberturas),
  },
  {
    id: 'trilha-tatica',
    category: 'tatica',
    title: 'Tática',
    description:
      'Garfos, cravadas, espetos, ataques descobertos e sacrifícios: os motivos que decidem a maioria das partidas.',
    lessonIds: ids(tatica),
  },
  {
    id: 'trilha-estrategia',
    category: 'estrategia',
    title: 'Estratégia',
    description:
      'Peças boas e ruins, estruturas de peões, casas fracas e postos avançados: as vantagens que duram a partida inteira.',
    lessonIds: ids(estrategia),
  },
  {
    id: 'trilha-meio-jogo',
    category: 'meio-jogo',
    title: 'Meio-jogo',
    description:
      'Torres nas colunas abertas, ataque ao rei e a arte de saber quando simplificar para um final ganho.',
    lessonIds: ids(meioJogo),
  },
  {
    id: 'trilha-finais',
    category: 'finais',
    title: 'Finais',
    description:
      'Mates básicos, finais de rei e peão e as posições de Lucena e Philidor: a técnica que converte vantagens em vitórias.',
    lessonIds: ids(finais),
  },
  {
    id: 'trilha-planejamento',
    category: 'planejamento',
    title: 'Planejamento',
    description:
      'Avaliar a posição, formular planos e calcular com método: como pensar quando não há uma tática evidente.',
    lessonIds: ids(planejamento),
  },
  {
    id: 'trilha-analise',
    category: 'analise',
    title: 'Análise de partidas',
    description:
      'Analisar as próprias partidas, usar o motor com critério e transformar padrões de erro em um plano de treino.',
    lessonIds: ids(analise),
  },
];
