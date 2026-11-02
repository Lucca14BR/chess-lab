import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { Lightbulb, Eye, ArrowRight, Star, Check, X, ExternalLink, ChessKnight, Timer, Puzzle as PuzzleIcon } from 'lucide-react';
import { db, type PuzzleAttempt } from '@/lib/db/schema';
import { loadPuzzles, CATEGORY_INFO, LEVEL_INFO, THEME_TEXT, type Puzzle } from '@/lib/puzzles';
import type { Level, PuzzleCategory } from '@/data/academy/types';
import { puzzleScore, puzzleThemeStats } from '@/lib/stats/study';
import { formatLine } from '@/lib/chess/board';
import { Page, PageHeader, Tabs } from '@/components/ui/Page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Form';
import { Alert, EmptyState, LoadingBlock, Stat } from '@/components/ui/Feedback';
import { Badge, SourceTag } from '@/components/ui/Badge';
import { ChessBoard } from '@/components/board/ChessBoard';
import { AXIS, TooltipBox } from '@/components/charts/Charts';
import { usePuzzleSession, solutionSan } from './usePuzzleSession';
import { cn, formatClock, formatDateTime, formatDuration } from '@/lib/utils';

type Mode = 'novos' | 'favoritos' | 'revisar';
const CATS = Object.keys(CATEGORY_INFO) as PuzzleCategory[];

function pickPuzzle(all: Puzzle[], opts: { category: PuzzleCategory | 'todos'; level: Level | 'todos'; mode: Mode; attempts: PuzzleAttempt[]; favorites: Set<string>; exclude?: string }): Puzzle | null {
  let pool = all.filter((p) => (opts.category === 'todos' || p.category === opts.category) && (opts.level === 'todos' || p.level === opts.level) && p.id !== opts.exclude);
  if (opts.mode === 'favoritos') pool = pool.filter((p) => opts.favorites.has(p.id));
  if (opts.mode === 'revisar') {
    const lastById = new Map<string, PuzzleAttempt>();
    for (const a of [...opts.attempts].sort((x, y) => x.date - y.date)) lastById.set(a.puzzleId, a);
    pool = pool.filter((p) => lastById.get(p.id) && !lastById.get(p.id)!.solved);
  }
  if (opts.mode === 'novos') {
    const seen = new Set(opts.attempts.map((a) => a.puzzleId));
    const fresh = pool.filter((p) => !seen.has(p.id));
    if (fresh.length) pool = fresh;
  }
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function PuzzlesPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<Puzzle[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState<PuzzleCategory | 'todos'>((params.get('tema') as PuzzleCategory) || 'todos');
  const [level, setLevel] = useState<Level | 'todos'>('todos');
  const [mode, setMode] = useState<Mode>('novos');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [empty, setEmpty] = useState(false);
  const [tab, setTab] = useState<'historico' | 'temas'>('temas');
  const attempts = useLiveQuery(() => db.puzzleAttempts.toArray(), []);
  const favorites = useLiveQuery(async () => new Set((await db.puzzleFavorites.toArray()).map((f) => f.puzzleId)), []);

  useEffect(() => {
    loadPuzzles()
      .then((f) => setData(f.puzzles))
      .catch(() => setLoadError('Não foi possível carregar a base de puzzles (public/data/puzzles.json).'));
  }, []);

  useEffect(() => {
    const t = params.get('tema') as PuzzleCategory | null;
    if (t && CATS.includes(t)) setCategory(t);
  }, [params]);

  const next = (exclude?: string) => {
    if (!data || !attempts || !favorites) return;
    const p = pickPuzzle(data, { category, level, mode, attempts, favorites, exclude });
    setEmpty(!p);
    setPuzzle(p);
  };

  // Primeiro puzzle (ou puzzle específico via ?id=)
  useEffect(() => {
    if (!data || !attempts || !favorites) return;
    const id = params.get('id');
    if (id) {
      const p = data.find((x) => x.id === id);
      if (p) {
        setPuzzle(p);
        setEmpty(false);
        return;
      }
    }
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, !!attempts, !!favorites, category, level, mode, params.get('id')]);

  const s = usePuzzleSession(puzzle);
  const isFav = !!puzzle && !!favorites?.has(puzzle.id);
  const score = attempts ? puzzleScore(attempts) : 0;
  const solved = attempts?.filter((a) => a.solved).length ?? 0;
  const finished = s.status === 'solved' || s.status === 'failed';

  const toggleFav = async () => {
    if (!puzzle) return;
    if (isFav) await db.puzzleFavorites.delete(puzzle.id);
    else await db.puzzleFavorites.put({ puzzleId: puzzle.id, addedAt: Date.now() });
  };

  const arrows = s.hint ? [{ from: s.hint, brush: 'yellow' as const }] : [];

  return (
    <Page>
      <PageHeader eyebrow="Workspace" title="Sala de Desafios" description="Seus puzzles: posições reais da base pública da Lichess (CC0), conferidas lance a lance. Tudo o que você resolve fica guardado aqui com você." />

      {/* Estatísticas */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'Pontuação', value: score, sub: 'pontos do Chess Lab' },
          { label: 'Resolvidos', value: solved, sub: `de ${attempts?.length ?? 0} tentativas` },
          { label: 'Taxa de acerto', value: attempts?.length ? `${Math.round((solved / attempts.length) * 100)}%` : '—', sub: 'primeira tentativa' },
          { label: 'Tempo médio', value: attempts?.length ? formatDuration(attempts.reduce((x, a) => x + a.timeMs, 0) / attempts.length) : '—', sub: 'por puzzle' },
          { label: 'Favoritos', value: favorites?.size ?? 0, sub: 'puzzles salvos' },
        ].map((x) => (
          <Card key={x.label} className="px-4 py-3">
            <Stat label={x.label} value={x.value} sub={x.sub} />
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="mb-5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tema">
            {(['todos', ...CATS] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => {
                  setCategory(c);
                  setParams(c === 'todos' ? {} : { tema: c });
                }}
                className={cn('rounded-full border px-3 py-1 text-xs transition-colors', category === c ? 'border-brass bg-accent-soft text-ink' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink')}
              >
                {c === 'todos' ? 'Todos os temas' : CATEGORY_INFO[c].label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Segmented<Level | 'todos'>
              size="sm"
              value={level}
              onChange={setLevel}
              ariaLabel="Dificuldade"
              options={[{ value: 'todos', label: 'Todos' }, ...(['iniciante', 'intermediario', 'avancado'] as Level[]).map((l) => ({ value: l, label: LEVEL_INFO[l].label }))]}
            />
            <Segmented<Mode>
              size="sm"
              value={mode}
              onChange={setMode}
              ariaLabel="Seleção"
              options={[
                { value: 'novos', label: 'Novos' },
                { value: 'revisar', label: 'Errados' },
                { value: 'favoritos', label: 'Favoritos' },
              ]}
            />
          </div>
        </div>
        {category !== 'todos' && <p className="mt-2 text-xs text-ink-muted">{CATEGORY_INFO[category].description}</p>}
      </Card>

      {loadError ? (
        <Alert tone="negative" title="Base de puzzles indisponível">
          {loadError}
        </Alert>
      ) : !data ? (
        <LoadingBlock label="Carregando puzzles…" />
      ) : empty || !puzzle ? (
        <Card>
          <EmptyState icon={<PuzzleIcon />} title="Nenhum puzzle com esses filtros" description={mode === 'favoritos' ? 'Você ainda não favoritou puzzles nesta combinação.' : mode === 'revisar' ? 'Nenhum puzzle errado para revisar nesta combinação.' : 'Tente outra combinação de tema e nível.'} />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="mx-auto w-full" style={{ maxWidth: 'min(640px, calc(100vh - 150px))' }}>
            <div className={cn('overflow-hidden rounded-md border', s.status === 'solved' ? 'border-positive/60' : s.status === 'failed' ? 'border-negative/50' : 'border-line')}>
              <ChessBoard fen={s.fen} orientation={s.userColor} movable={s.status === 'playing' || (s.status === 'failed' && !s.done) ? s.userColor : false} onMove={s.userMove} lastMove={s.lastMove} arrows={arrows} syncToken={s.syncToken} />
            </div>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader
                icon={<ChessKnight />}
                title={s.status === 'solved' ? 'Correto!' : s.status === 'failed' ? 'Não foi desta vez' : `${s.userColor === 'white' ? 'Brancas' : 'Pretas'} jogam`}
                subtitle={`${CATEGORY_INFO[puzzle.category].label} · ${LEVEL_INFO[puzzle.level].label}`}
                action={
                  <Button size="icon-sm" variant="ghost" onClick={toggleFav} aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar puzzle'} aria-pressed={isFav}>
                    <Star className={isFav ? 'fill-brass text-brass' : ''} />
                  </Button>
                }
              />
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <Timer className="size-4" /> <span className="font-mono text-ink tabular-nums">{formatClock(s.elapsed)}</span>
                  </span>
                  {finished ? <Badge tone="accent">Rating {puzzle.rating}</Badge> : <span className="text-xs text-ink-faint">Encontre a melhor continuação</span>}
                </div>
                {s.wrong && (
                  <Alert tone="negative" title={`${s.wrong} não é a solução`}>
                    {s.status === 'failed' && !s.done ? 'A tentativa foi registrada como erro, mas você pode continuar procurando o lance certo.' : null}
                  </Alert>
                )}
                {s.status === 'solved' && <Alert tone="positive" title="Puzzle resolvido">{`Tempo: ${formatDuration(s.elapsed)}.`}</Alert>}
                <div className="flex flex-wrap gap-2">
                  {!finished && (
                    <Button onClick={s.showHint} disabled={s.status !== 'playing' || !!s.hint}>
                      <Lightbulb /> Dica
                    </Button>
                  )}
                  {!s.done && s.status !== 'solved' && (
                    <Button onClick={s.revealSolution} disabled={s.status === 'loading' || s.status === 'opponent'}>
                      <Eye /> Ver solução
                    </Button>
                  )}
                  <Button variant="primary" onClick={() => next(puzzle.id)} className="ml-auto">
                    {finished ? 'Próximo' : 'Pular'} <ArrowRight />
                  </Button>
                </div>
                {s.hint && !finished && <p className="text-xs text-ink-muted">Dica: a peça destacada em amarelo participa do próximo lance. Usar dica reduz os pontos pela metade.</p>}
              </CardBody>
            </Card>
            {finished && <Explanation puzzle={puzzle} />}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'temas', label: 'Estatísticas por tema' },
            { value: 'historico', label: 'Histórico de tentativas', count: attempts?.length },
          ]}
        />
        {tab === 'temas' ? <ThemeStats attempts={attempts ?? []} /> : <History attempts={attempts ?? []} onOpen={(id) => setParams({ id })} />}
      </div>
    </Page>
  );
}

function Explanation({ puzzle }: { puzzle: Puzzle }) {
  const sans = useMemo(() => solutionSan(puzzle), [puzzle]);
  // A linha começa no lance do adversário, a partir da FEN original do puzzle.
  const startFen = puzzle.fen;
  const themes = puzzle.themes.filter((t) => THEME_TEXT[t]);
  return (
    <Card>
      <CardHeader icon={<Lightbulb />} title="Explicação" />
      <CardBody className="space-y-3 text-sm">
        <div>
          <p className="mb-1 text-[11px] tracking-wide text-ink-muted uppercase">Lance do adversário e solução</p>
          <p className="font-mono text-[13px] leading-relaxed text-ink">{formatLine(startFen, sans)}</p>
        </div>
        {themes.length > 0 && (
          <ul className="space-y-1.5">
            {themes.map((t) => (
              <li key={t} className="text-ink-muted">
                {THEME_TEXT[t]}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink-faint">As explicações descrevem os temas táticos atribuídos ao puzzle pela base da Lichess. Para entender as alternativas, abra a posição no Tabuleiro e peça a análise do motor.</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/tabuleiro?fen=${encodeURIComponent(puzzle.fen)}`} size="sm">Abrir no Tabuleiro</ButtonLink>
          <ButtonLink href={puzzle.gameUrl} size="sm" variant="ghost">
              <ExternalLink /> Partida original
            </ButtonLink>
        </div>
        <p className="text-[11px] text-ink-faint">Puzzle {puzzle.id} · Lichess (CC0)</p>
      </CardBody>
    </Card>
  );
}

function ThemeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { label: string; accuracy: number; attempts: number; avg: string };
  return (
    <TooltipBox title={p.label}>
      {p.accuracy}% de acerto · {p.attempts} tentativas · {p.avg} em média
    </TooltipBox>
  );
}

function ThemeStats({ attempts }: { attempts: PuzzleAttempt[] }) {
  const stats = puzzleThemeStats(attempts);
  if (!stats.length) return <Card><EmptyState icon={<PuzzleIcon />} title="Sem estatísticas ainda" description="Resolva puzzles para ver sua taxa de acerto e tempo médio por tema." /></Card>;
  const data = CATS.map((c) => {
    const s = stats.find((x) => x.category === c);
    return { label: CATEGORY_INFO[c].label, accuracy: s?.accuracy ?? 0, attempts: s?.attempts ?? 0, avg: s ? formatDuration(s.avgTimeMs) : '—' };
  }).filter((d) => d.attempts > 0);
  return (
    <Card>
      <CardBody>
        <div className="mb-2 flex justify-end">
          <SourceTag source="calc" />
        </div>
        <BarChart responsive style={{ width: '100%', height: 260 }} data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" {...AXIS} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis domain={[0, 100]} unit="%" {...AXIS} />
          <Tooltip content={ThemeTooltip} cursor={{ fill: 'var(--bg-hover)' }} />
          <Bar dataKey="accuracy" fill="var(--positive)" radius={[3, 3, 0, 0]} maxBarSize={42} />
        </BarChart>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-ink-muted uppercase">
                <th className="pb-2 font-medium">Tema</th>
                <th className="pb-2 font-medium">Tentativas</th>
                <th className="pb-2 font-medium">Acertos</th>
                <th className="pb-2 font-medium">Taxa</th>
                <th className="pb-2 font-medium">Tempo médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {stats.sort((a, b) => b.attempts - a.attempts).map((s) => (
                <tr key={s.category}>
                  <td className="py-2 text-ink">
                    <Link to={`/puzzles?tema=${s.category}`} className="hover:underline">
                      {CATEGORY_INFO[s.category].label}
                    </Link>
                  </td>
                  <td className="py-2 text-ink-muted">{s.attempts}</td>
                  <td className="py-2 text-ink-muted">{s.solved}</td>
                  <td className={cn('py-2', s.accuracy >= 70 ? 'text-positive' : s.accuracy < 50 ? 'text-negative' : 'text-ink')}>{s.accuracy}%</td>
                  <td className="py-2 text-ink-muted">{formatDuration(s.avgTimeMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function History({ attempts, onOpen }: { attempts: PuzzleAttempt[]; onOpen: (id: string) => void }) {
  const [limit, setLimit] = useState(30);
  const list = [...attempts].sort((a, b) => b.date - a.date);
  if (!list.length) return <Card><EmptyState icon={<PuzzleIcon />} title="Nenhuma tentativa registrada" /></Card>;
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] tracking-wide text-ink-muted uppercase">
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium">Tema</th>
              <th className="px-4 py-2.5 font-medium">Nível</th>
              <th className="px-4 py-2.5 font-medium">Rating</th>
              <th className="px-4 py-2.5 font-medium">Resultado</th>
              <th className="px-4 py-2.5 font-medium">Tempo</th>
              <th className="px-4 py-2.5 font-medium">Pontos</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums">
            {list.slice(0, limit).map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 text-ink-muted">{formatDateTime(a.date)}</td>
                <td className="px-4 py-2 text-ink">{CATEGORY_INFO[a.category].label}</td>
                <td className="px-4 py-2 text-ink-muted">{LEVEL_INFO[a.level].label}</td>
                <td className="px-4 py-2 text-ink-muted">{a.rating}</td>
                <td className="px-4 py-2">{a.solved ? <span className="inline-flex items-center gap-1 text-positive"><Check className="size-3.5" /> Resolvido{a.hintUsed ? ' (dica)' : ''}</span> : <span className="inline-flex items-center gap-1 text-negative"><X className="size-3.5" /> Errado</span>}</td>
                <td className="px-4 py-2 text-ink-muted">{formatDuration(a.timeMs)}</td>
                <td className="px-4 py-2 text-ink-muted">{a.points}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => onOpen(a.puzzleId)}>
                    Refazer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > limit && (
        <div className="border-t border-line p-3 text-center">
          <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + 50)}>
            Mostrar mais
          </Button>
        </div>
      )}
    </Card>
  );
}
