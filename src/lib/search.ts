import { db } from '@/lib/db/schema';
import { LESSONS } from '@/data/academyContent';
import { OPENINGS } from '@/data/openings';
import { CATEGORY_INFO } from '@/lib/puzzles';
import { normalizeText } from '@/lib/utils';
import { RESULT_WORD } from '@/lib/labels';

export interface SearchResult {
  group: 'Páginas' | 'Aulas' | 'Aberturas' | 'Puzzles' | 'Notas' | 'Posições' | 'Partidas' | 'Repertório';
  title: string;
  subtitle?: string;
  to: string;
}

const PAGES: SearchResult[] = [
  { group: 'Páginas', title: 'Painel Inicial', to: '/' },
  { group: 'Páginas', title: 'Tabuleiro', subtitle: 'Jogar, analisar, FEN e PGN', to: '/tabuleiro' },
  { group: 'Páginas', title: 'Jogar', subtitle: 'Partida contra o computador', to: '/jogar' },
  { group: 'Páginas', title: 'Conversa', subtitle: 'Chat com o tutor de IA e tabuleiro', to: '/conversa' },
  { group: 'Páginas', title: 'Puzzles', subtitle: 'Sala de desafios táticos', to: '/puzzles' },
  { group: 'Páginas', title: 'Academia', subtitle: 'Trilhas e aulas', to: '/academia' },
  { group: 'Páginas', title: 'Aberturas', subtitle: 'Biblioteca e repertório', to: '/aberturas' },
  { group: 'Páginas', title: 'Desempenho', subtitle: 'Estatísticas e partidas', to: '/desempenho' },
  { group: 'Páginas', title: 'Partidas importadas', subtitle: 'Histórico do Chess.com', to: '/desempenho?aba=partidas' },
  { group: 'Páginas', title: 'Caderno de Estudos', subtitle: 'Notas e coleções', to: '/caderno' },
  { group: 'Páginas', title: 'Centro de Treino', subtitle: 'Plano semanal, metas e sessões', to: '/treino' },
  { group: 'Páginas', title: 'Configurações', subtitle: 'Conta Chess.com, tema e dados', to: '/configuracoes' },
];

function matches(q: string, ...fields: Array<string | null | undefined>) {
  return fields.some((f) => f && normalizeText(f).includes(q));
}

export async function searchAll(raw: string, limitPerGroup = 5): Promise<SearchResult[]> {
  const q = normalizeText(raw.trim());
  if (q.length < 2) return [];
  const out: SearchResult[] = [];
  const push = (items: SearchResult[]) => out.push(...items.slice(0, limitPerGroup));

  push(PAGES.filter((p) => matches(q, p.title, p.subtitle)));
  push(LESSONS.filter((l) => matches(q, l.title, l.description, ...l.keyPoints)).map((l) => ({ group: 'Aulas', title: l.title, subtitle: l.description, to: `/academia/${l.id}` })));
  push(OPENINGS.filter((o) => matches(q, o.name, o.summary, ...o.eco, ...o.lines.map((l) => l.name))).map((o) => ({ group: 'Aberturas', title: o.name, subtitle: o.eco.join(', '), to: `/aberturas/${o.id}` })));
  push(
    Object.entries(CATEGORY_INFO)
      .filter(([, c]) => matches(q, c.label, c.description))
      .map(([id, c]) => ({ group: 'Puzzles', title: c.label, subtitle: c.description, to: `/puzzles?tema=${id}` })),
  );

  const [notes, positions, repertoire] = await Promise.all([db.notes.toArray(), db.positions.toArray(), db.repertoire.toArray()]);
  push(notes.filter((n) => matches(q, n.title, n.body, n.category, ...n.tags)).map((n) => ({ group: 'Notas', title: n.title || 'Sem título', subtitle: n.category, to: `/caderno?nota=${n.id}` })));
  push(positions.filter((p) => matches(q, p.name, p.notes, p.fen, ...p.tags)).map((p) => ({ group: 'Posições', title: p.name, subtitle: p.fen, to: `/tabuleiro?fen=${encodeURIComponent(p.fen)}` })));
  push(repertoire.filter((r) => matches(q, r.name, r.notes)).map((r) => ({ group: 'Repertório', title: r.name, subtitle: r.color === 'white' ? 'Brancas' : 'Pretas', to: `/aberturas?repertorio=${r.id}` })));

  const games: SearchResult[] = [];
  await db.games
    .orderBy('endTime')
    .reverse()
    .until(() => games.length >= limitPerGroup)
    .each((g) => {
      if (matches(q, g.opponent, g.openingName, g.eco)) {
        games.push({ group: 'Partidas', title: `vs ${g.opponent}`, subtitle: `${RESULT_WORD[g.result]} · ${g.openingName ?? 'Abertura desconhecida'}`, to: `/desempenho?aba=partidas&busca=${encodeURIComponent(g.opponent)}` });
      }
    });
  push(games);
  return out;
}
