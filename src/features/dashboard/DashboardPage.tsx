import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChartNoAxesColumn, Target, Zap, ChessKnight, CalendarDays, Puzzle, GraduationCap, Lightbulb, UserRound, ArrowRight, Check, X, RefreshCw, Trophy, Hand } from 'lucide-react';
import { db, type GameAnalysis, type TimeClass } from '@/lib/db/schema';
import { useAccount, useImportedGames, useStudyData, useUserName, type StudyData } from '@/lib/hooks';
import { setSetting, useSettings } from '@/lib/settings';
import { useStore } from '@/lib/store';
import { syncStore, syncAccount } from '@/lib/chesscom/sync';
import { TIME_CLASS_LABEL, modeStats } from '@/lib/chesscom/normalize';
import { ratingSeries, ratingDelta, wdl } from '@/lib/stats/games';
import { currentWeekIso, goalProgress, weekBounds } from '@/lib/stats/study';
import { buildRecommendations, recommendedPuzzleCategories } from '@/lib/services/recommendations';
import { LESSON_BY_ID, lessonPercent } from '@/lib/services/academy';
import { CATEGORY_INFO } from '@/lib/puzzles';
import { ACTIVITY_TYPES, GOAL_METRICS } from '@/lib/labels';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, ProgressBar, Ring, Skeleton } from '@/components/ui/Feedback';
import { Input, Segmented } from '@/components/ui/Form';
import { SourceTag } from '@/components/ui/Badge';
import { RatingAreaChart, WdlLegend } from '@/components/charts/Charts';
import { MiniBoard } from '@/components/board/ChessBoard';
import { ConnectChessCom } from '@/features/account/ConnectChessCom';
import { HeroLibrary } from './HeroLibrary';
import { cn, formatDateTime, formatDuration, formatRelative, greeting, isoDay, addDays, parseIsoDay } from '@/lib/utils';

const MAXIMS = [
  'Pequenos passos, grandes conquistas.',
  'Cada partida perdida é uma aula que você já pagou.',
  'Antes de cada lance: o que meu adversário ameaça?',
  'Constância vence talento sem disciplina.',
  'Entenda o plano; os lances virão.',
  'Calcule com calma, decida com coragem.',
  'O tabuleiro recompensa quem revisa os próprios erros.',
];

const TIME_CLASSES: TimeClass[] = ['rapid', 'blitz', 'bullet', 'daily'];

export default function DashboardPage() {
  const account = useAccount();
  const games = useImportedGames();
  const study = useStudyData();
  const settings = useSettings();
  const sync = useStore(syncStore);
  const analyses = useLiveQuery(() => db.analyses.toArray(), []);

  const name = useUserName();
  const maxim = MAXIMS[new Date().getDate() % MAXIMS.length];

  return (
    <div>
      {/* Cabeçalho cinematográfico */}
      <section className="relative isolate overflow-hidden border-b border-line" style={{ minHeight: 300 }}>
        {settings.headerImage ? (
          <>
            <img src={settings.headerImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#120b07]/95 via-[#120b07]/60 to-transparent" />
          </>
        ) : (
          <HeroLibrary />
        )}
        <div className="relative mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-5 pt-16 pb-10 lg:px-8">
          <div>
            <h1 className="font-display text-[44px] leading-[1.02] text-[#efe4cf] sm:text-[56px]">
              {greeting()},
              <br />
              {name ? `${name}.` : 'que bom ver você por aqui.'}
            </h1>
            <p className="font-display mt-4 text-xl text-[#d8c7a8] italic">“{maxim}”</p>
          </div>
          {account && (
            <div className="flex items-center gap-3 rounded-lg border border-[#d5c1a0]/20 bg-[#120b07]/60 px-4 py-3 backdrop-blur-sm">
              {account.profile.avatar && <img src={account.profile.avatar} alt="" className="size-10 rounded-md object-cover" referrerPolicy="no-referrer" />}
              <div className="text-xs text-[#bfae92]">
                <p className="text-sm font-medium text-[#efe4cf]">{account.displayUsername}</p>
                <p>
                  {sync.running ? (
                    <span className="inline-flex items-center gap-1">
                      <RefreshCw className="size-3 animate-spin" /> {sync.step}
                    </span>
                  ) : account.lastGamesSyncAt ? (
                    `Sincronizado ${formatRelative(account.lastGamesSyncAt)}`
                  ) : (
                    'Aguardando primeira sincronização'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-5 py-6 md:grid-cols-2 lg:px-8 xl:grid-cols-3">
        <WelcomeCard />
        {account === undefined || games === undefined ? (
          <Card className="p-5 xl:col-span-1">
            <Skeleton className="h-40" />
          </Card>
        ) : account ? (
          <ProgressCard games={games} stats={account.stats} />
        ) : (
          <Card className="md:col-span-2 xl:col-span-2">
            <CardHeader icon={<ChartNoAxesColumn />} title="Conecte sua conta do Chess.com" subtitle="Para acompanhar aqui seu rating, sua evolução e seu histórico reais." />
            <CardBody>
              <ConnectChessCom compact />
              <p className="mt-3 text-xs text-ink-faint">Sem conta conectada, não há estatísticas de partidas por aqui. Seus puzzles, aulas, caderno e treinos funcionam normalmente.</p>
            </CardBody>
          </Card>
        )}
        <GoalsCard study={study} games={games ?? []} />
        <ActivityCard />
        <LastTrainingCard />
        <UpcomingCard planned={study?.planned} />
        <LessonsCard lessons={study?.lessons} />
        <RecommendedPuzzlesCard attempts={study?.attempts} />
        <RecommendationsCard games={games ?? []} study={study} analyses={analyses ?? []} />
        {account && <ProfileCard />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

// Pergunta o nome uma vez; some ao salvar ou com "Agora não"
function WelcomeCard() {
  const saved = useLiveQuery(async () => {
    const [n, d] = await db.settings.bulkGet(['displayName', 'welcomeDismissed']);
    return { name: (n?.value as string | undefined) ?? '', dismissed: d?.value === true };
  }, []);
  const [draft, setDraft] = useState('');
  // Ainda carregando, com nome ou dispensado: nada a mostrar
  if (!saved || saved.name || saved.dismissed) return null;
  const name = draft.trim();
  return (
    <Card>
      <CardHeader icon={<Hand />} title="Como devemos chamar você?" subtitle="Seu nome aparece na saudação, na barra lateral e nas conversas com o tutor." />
      <CardBody>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name) void setSetting('displayName', name);
          }}
        >
          <Input value={draft} maxLength={40} onChange={(e) => setDraft(e.target.value)} placeholder="Seu nome" aria-label="Seu nome" className="min-w-0 flex-1" />
          <Button type="submit" size="sm" variant="primary" disabled={!name}>
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void setSetting('welcomeDismissed', true)}>
            Agora não
          </Button>
        </form>
        <p className="mt-3 text-xs text-ink-faint">Fica só neste navegador. Dá para mudar quando quiser em Configurações.</p>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function ProgressCard({ games, stats }: { games: NonNullable<ReturnType<typeof useImportedGames>>; stats: NonNullable<ReturnType<typeof useAccount>>['stats'] }) {
  const available = TIME_CLASSES.filter((tc) => modeStats(stats, tc)?.last || games.some((g) => g.timeClass === tc));
  const byCount = [...available].sort((a, b) => games.filter((g) => g.timeClass === b).length - games.filter((g) => g.timeClass === a).length);
  const [tc, setTc] = useState<TimeClass | null>(null);
  const active = tc ?? byCount[0] ?? 'rapid';
  const series = useMemo(() => ratingSeries(games, active), [games, active]);
  const mode = modeStats(stats, active);
  const delta = ratingDelta(series, Date.now() - 30 * 86400_000);
  const record = mode?.record;

  return (
    <Card>
      <CardHeader icon={<ChartNoAxesColumn />} title="Seu Progresso" action={<Link to="/desempenho" className="text-xs text-ink-muted hover:text-ink">Detalhes <ArrowRight className="inline size-3" /></Link>} />
      <CardBody>
        {available.length > 1 && (
          <Segmented size="sm" value={active} onChange={setTc} options={available.map((t) => ({ value: t, label: TIME_CLASS_LABEL[t] }))} className="mb-3" ariaLabel="Controle de tempo" />
        )}
        {mode?.last ? (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display text-5xl leading-none text-ink tabular-nums">{mode.last.rating}</span>
                  {delta != null && delta !== 0 && (
                    <span className={cn('text-sm font-medium tabular-nums', delta > 0 ? 'text-positive' : 'text-negative')} title="Variação nos últimos 30 dias, calculada a partir das partidas importadas">
                      {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Rating {TIME_CLASS_LABEL[active]} <SourceTag source="api" className="ml-1" />
                </p>
              </div>
              {mode.best && (
                <div className="text-right">
                  <div className="text-[11px] text-ink-muted uppercase">Melhor</div>
                  <div className="font-display text-xl text-ink tabular-nums">{mode.best.rating}</div>
                </div>
              )}
            </div>
            <div className="mt-3">
              {series.length >= 2 ? (
                <>
                  <RatingAreaChart data={series} height={120} compact />
                  <p className="mt-1 text-right">
                    <SourceTag source="calc" /> <span className="text-[10.5px] text-ink-faint">{series.length} dias com partidas</span>
                  </p>
                </>
              ) : (
                <p className="py-6 text-center text-xs text-ink-muted">Ainda faltam partidas {TIME_CLASS_LABEL[active].toLowerCase()} importadas para desenhar a sua evolução.</p>
              )}
            </div>
            {record && (
              <div className="mt-3 border-t border-line pt-3">
                <WdlLegend win={record.win} draw={record.draw} loss={record.loss} />
                <p className="mt-2 text-center">
                  <SourceTag source="api" /> <span className="text-[10.5px] text-ink-faint">histórico completo da conta</span>
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyState compact title="Sem rating neste controle" description={stats ? 'O Chess.com não informa rating para esta modalidade.' : 'Importando estatísticas…'} />
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function GoalsCard({ study, games }: { study: ReturnType<typeof useStudyData>; games: NonNullable<ReturnType<typeof useImportedGames>> }) {
  const week = currentWeekIso();
  const { start, end } = weekBounds(week);
  const goals = (study?.goals ?? []).filter((g) => g.active && (g.week === week || g.week === 'recorrente'));
  const input = study ? { attempts: study.attempts, lessons: study.lessons, sessions: study.sessions, activity: study.activity, gamesInWeek: games.filter((g) => g.endTime >= start && g.endTime < end).length } : null;
  const rows = input ? goals.map((g) => ({ g, value: goalProgress(g, week, input) })) : [];
  const overall = rows.length ? Math.round((rows.reduce((s, r) => s + Math.min(1, r.value / r.g.target), 0) / rows.length) * 100) : 0;
  const featured = rows[0];

  return (
    <Card>
      <CardHeader icon={<Target />} title="Seus Objetivos" action={<Link to="/treino?aba=metas" className="text-xs text-ink-muted hover:text-ink">Ver todos <ArrowRight className="inline size-3" /></Link>} />
      <CardBody>
        {!study ? (
          <Skeleton className="h-32" />
        ) : rows.length === 0 ? (
          <EmptyState compact icon={<Target />} title="Nenhuma meta nesta semana" description="Escolha suas metas da semana; o progresso é calculado sozinho a partir dos seus treinos." action={<ButtonLink to="/treino?aba=metas" size="sm" variant="primary">Criar meta</ButtonLink>} />
        ) : (
          <>
            <div className="flex items-center gap-5">
              <Ring value={overall}>
                <span className="font-display text-2xl text-ink tabular-nums">{overall}%</span>
              </Ring>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug text-ink">{featured.g.title}</p>
                <ProgressBar value={featured.value} max={featured.g.target} className="mt-2" />
                <p className="mt-1.5 text-sm text-ink-muted tabular-nums">
                  {featured.value} / {featured.g.target} {GOAL_METRICS[featured.g.metric].unit}
                </p>
              </div>
            </div>
            {rows.length > 1 && (
              <ul className="mt-4 space-y-2 border-t border-line pt-3">
                {rows.slice(1, 4).map(({ g, value }) => (
                  <li key={g.id} className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-ink-muted">{g.title}</span>
                    <span className="text-xs text-ink-faint tabular-nums">
                      {value}/{g.target}
                    </span>
                    <ProgressBar value={value} max={g.target} className="w-20" />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> Semana atual
              </span>
              <span>
                {parseIsoDay(week).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {addDays(parseIsoDay(week), 6).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function ActivityCard() {
  const items = useLiveQuery(() => db.activity.orderBy('date').reverse().limit(5).toArray(), []);
  return (
    <Card>
      <CardHeader icon={<Zap />} title="Atividade Recente" />
      <CardBody className="py-2">
        {!items ? (
          <Skeleton className="my-2 h-32" />
        ) : items.length === 0 ? (
          <EmptyState compact icon={<Zap />} title="Nada por aqui ainda" description="Seus puzzles, aulas, sessões e sincronizações vão aparecer aqui." />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((a) => (
              <li key={a.id}>
                <Link to={a.link ?? '#'} className="flex items-center gap-3 py-2.5 hover:opacity-90">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-sunken text-brass [&_svg]:size-4">{activityIcon(a.kind)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{a.title}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {a.detail ? `${a.detail} · ` : ''}
                      {formatRelative(a.date)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function activityIcon(kind: string) {
  switch (kind) {
    case 'puzzle':
      return <Puzzle />;
    case 'lesson':
      return <GraduationCap />;
    case 'session':
      return <Trophy />;
    case 'sync':
      return <RefreshCw />;
    default:
      return <ChessKnight />;
  }
}

/* ------------------------------------------------------------------ */

function LastTrainingCard() {
  const last = useLiveQuery(async () => {
    const [attempt, session] = await Promise.all([db.puzzleAttempts.orderBy('date').last(), db.sessions.orderBy('startedAt').last()]);
    return { attempt, session };
  }, []);
  const [fen, setFen] = useState<string | null>(null);
  const attempt = last?.attempt;
  // Carrega a posição do puzzle a partir da base local.
  useEffect(() => {
    if (!attempt) return;
    void import('@/lib/puzzles').then(({ loadPuzzles }) =>
      loadPuzzles()
        .then((f) => {
          const p = f.puzzles.find((x) => x.id === attempt.puzzleId);
          if (p) void import('chess.js').then(({ Chess }) => {
            const c = new Chess(p.fen);
            c.move({ from: p.moves[0].slice(0, 2), to: p.moves[0].slice(2, 4), promotion: p.moves[0][4] });
            setFen(c.fen());
          });
        })
        .catch(() => undefined),
    );
  }, [attempt]);

  return (
    <Card>
      <CardHeader icon={<Trophy />} title="Seu Último Treino" />
      <CardBody>
        {!last ? (
          <Skeleton className="h-36" />
        ) : !attempt && !last.session ? (
          <EmptyState compact icon={<Puzzle />} title="Nenhum treino ainda" description="Que tal começar com um puzzle ou uma sessão no Centro de Treino?" action={<ButtonLink to="/puzzles" size="sm" variant="primary">Resolver um puzzle</ButtonLink>} />
        ) : (
          <div className="flex gap-4">
            {attempt && fen && (
              <div className="w-[132px] shrink-0 overflow-hidden rounded border border-line">
                <MiniBoard fen={fen} orientation={fen.split(' ')[1] === 'w' ? 'white' : 'black'} />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-3">
              {attempt && (
                <div>
                  <p className="text-[15px] text-ink">Puzzle · {CATEGORY_INFO[attempt.category].label}</p>
                  <p className={cn('mt-1 flex items-center gap-1 text-sm font-medium', attempt.solved ? 'text-positive' : 'text-negative')}>
                    {attempt.solved ? <Check className="size-4" /> : <X className="size-4" />} {attempt.solved ? 'Correto' : 'Não resolvido'}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Rating {attempt.rating} · {formatDuration(attempt.timeMs)} · {formatRelative(attempt.date)}
                  </p>
                </div>
              )}
              {last.session && (
                <div className="border-t border-line pt-2 text-xs text-ink-muted">
                  Última sessão: <span className="text-ink">{formatDuration(last.session.totalMs)}</span> em {formatDateTime(last.session.startedAt)}
                </div>
              )}
              <ButtonLink to="/puzzles" size="sm" variant="primary">
                  Resolver outro <ArrowRight />
                </ButtonLink>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function UpcomingCard({ planned }: { planned: StudyData['planned'] | undefined }) {
  const today = isoDay();
  const upcoming = (planned ?? []).filter((p) => !p.done && p.day >= today).sort((a, b) => (a.day + (a.time ?? '99')).localeCompare(b.day + (b.time ?? '99'))).slice(0, 4);
  const tomorrow = isoDay(addDays(new Date(), 1));
  const dayLabel = (d: string) => (d === today ? 'Hoje' : d === tomorrow ? 'Amanhã' : parseIsoDay(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }));
  return (
    <Card>
      <CardHeader icon={<CalendarDays />} title="Próximas Atividades" action={<Link to="/treino?aba=plano" className="text-xs text-ink-muted hover:text-ink">Ver calendário <ArrowRight className="inline size-3" /></Link>} />
      <CardBody>
        {!planned ? (
          <Skeleton className="h-32" />
        ) : upcoming.length === 0 ? (
          <EmptyState compact icon={<CalendarDays />} title="Agenda livre" description="Sua semana está livre. Planeje atividades no Centro de Treino." action={<ButtonLink to="/treino?aba=plano" size="sm">Planejar semana</ButtonLink>} />
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {upcoming.map((p, i) => (
              <li key={p.id} className="relative">
                <span className={cn('absolute top-1 -left-[26px] size-3 rounded-full border-2', i === 0 ? 'border-positive bg-positive' : 'border-ink-faint bg-panel')} />
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className={cn('text-xs tabular-nums', i === 0 ? 'text-positive' : 'text-ink-muted')}>
                    {dayLabel(p.day)}
                    {p.time ? ` · ${p.time}` : ''}
                  </span>
                  <span className="text-sm text-ink">{p.title}</span>
                </div>
                <span className="text-xs text-ink-faint">
                  {ACTIVITY_TYPES[p.type].label} · {p.minutes} min
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function LessonsCard({ lessons }: { lessons: StudyData['lessons'] | undefined }) {
  const inProgress = (lessons ?? []).filter((l) => l.status === 'started').sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const completed = (lessons ?? []).filter((l) => l.status === 'completed').length;
  return (
    <Card>
      <CardHeader icon={<GraduationCap />} title="Aulas em Andamento" subtitle={lessons ? `${completed} concluída${completed === 1 ? '' : 's'} de ${LESSON_BY_ID.size}` : undefined} action={<Link to="/academia" className="text-xs text-ink-muted hover:text-ink">Academia <ArrowRight className="inline size-3" /></Link>} />
      <CardBody>
        {!lessons ? (
          <Skeleton className="h-28" />
        ) : inProgress.length === 0 ? (
          <EmptyState compact icon={<GraduationCap />} title="Nenhuma aula em andamento" description="Escolha uma trilha na Academia e comece pela primeira aula, no seu ritmo." action={<ButtonLink to="/academia" size="sm">Abrir Academia</ButtonLink>} />
        ) : (
          <ul className="space-y-3">
            {inProgress.map((p) => {
              const l = LESSON_BY_ID.get(p.lessonId);
              if (!l) return null;
              const percent = lessonPercent(l, p);
              return (
                <li key={p.lessonId}>
                  <Link to={`/academia/${l.id}`} className="block rounded-md p-2 -m-2 hover:bg-hover">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate text-ink">{l.title}</span>
                      <span className="text-xs text-ink-muted tabular-nums">{percent}%</span>
                    </div>
                    <ProgressBar value={percent} className="mt-1.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function RecommendedPuzzlesCard({ attempts }: { attempts: StudyData['attempts'] | undefined }) {
  const cats = attempts ? recommendedPuzzleCategories(attempts) : [];
  return (
    <Card>
      <CardHeader icon={<Puzzle />} title="Puzzles Recomendados" subtitle={attempts?.length ? 'Com base nas suas taxas de acerto por tema' : 'Temas para começar'} />
      <CardBody className="space-y-2">
        {!attempts ? (
          <Skeleton className="h-28" />
        ) : (
          cats.map((c) => {
            const list = attempts.filter((a) => a.category === c);
            const acc = list.length ? Math.round((list.filter((a) => a.solved).length / list.length) * 100) : null;
            return (
              <Link key={c} to={`/puzzles?tema=${c}`} className="flex items-center gap-3 rounded-md border border-line bg-sunken px-3 py-2.5 hover:border-line-strong">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink">{CATEGORY_INFO[c].label}</span>
                  <span className="block truncate text-xs text-ink-muted">{acc == null ? 'Tema ainda não praticado' : `${acc}% de acerto em ${list.length} tentativas`}</span>
                </span>
                <ArrowRight className="size-4 text-ink-faint" />
              </Link>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function RecommendationsCard({ games, study, analyses }: { games: NonNullable<ReturnType<typeof useImportedGames>>; study: ReturnType<typeof useStudyData>; analyses: GameAnalysis[] }) {
  const recs = study ? buildRecommendations({ games, attempts: study.attempts, lessons: study.lessons, analyses }).slice(0, 3) : [];
  return (
    <Card>
      <CardHeader icon={<Lightbulb />} title="Recomendações" subtitle={<span className="inline-flex items-center gap-1.5">Regras aplicadas aos seus dados <SourceTag source="calc" /></span>} />
      <CardBody className="space-y-3">
        {!study ? (
          <Skeleton className="h-28" />
        ) : recs.length === 0 ? (
          <EmptyState compact icon={<Lightbulb />} title="Sem recomendações por enquanto" description="Elas aparecem quando as suas partidas, puzzles e aulas já mostram padrões." />
        ) : (
          recs.map((r) => (
            <div key={r.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-ink">{r.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{r.reason}</p>
              <Link to={r.link} className="mt-1.5 inline-flex items-center gap-1 text-xs text-brass hover:underline">
                {r.cta} <ArrowRight className="size-3" />
              </Link>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function ProfileCard() {
  const account = useAccount();
  const games = useImportedGames();
  const sync = useStore(syncStore);
  if (!account) return null;
  const s = account.stats;
  const p = account.profile;
  const imported = games ? wdl(games.filter((g) => g.rules === 'chess')) : null;
  return (
    <Card className="md:col-span-2 xl:col-span-3">
      <CardHeader
        icon={<UserRound />}
        title="Perfil do Jogador"
        subtitle={
          <span>
            Dados do Chess.com {account.lastStatsSyncAt ? `atualizados ${formatRelative(account.lastStatsSyncAt)}` : ''} · a API pode ter atraso de até 12 h
          </span>
        }
        action={
          <Button size="sm" variant="ghost" onClick={() => void syncAccount({ force: true })} disabled={sync.running}>
            <RefreshCw className={cn(sync.running && 'animate-spin')} /> Atualizar
          </Button>
        }
      />
      <CardBody>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="flex items-start gap-3">
            {p.avatar ? <img src={p.avatar} alt="" className="size-16 rounded-md object-cover" referrerPolicy="no-referrer" /> : <div className="font-display flex size-16 items-center justify-center rounded-md bg-panel-2 text-3xl">{p.username[0]}</div>}
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-ink">
                {p.title && <span className="mr-1 rounded bg-negative-soft px-1 text-xs text-negative">{p.title}</span>}
                {p.username}
              </p>
              {p.name && <p className="truncate text-ink-muted">{p.name}</p>}
              <p className="text-xs text-ink-faint">País: {p.country.split('/').pop()}</p>
              <p className="text-xs text-ink-faint">Membro desde {new Date(p.joined * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
              <p className="text-xs text-ink-faint">Último acesso {formatRelative(p.last_online * 1000)}</p>
              <a href={p.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-brass hover:underline">
                Ver no Chess.com
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-ink-muted uppercase">
                  <th className="pb-2 font-medium">Modalidade</th>
                  <th className="pb-2 font-medium">Atual</th>
                  <th className="pb-2 font-medium">Melhor</th>
                  <th className="pb-2 font-medium">V</th>
                  <th className="pb-2 font-medium">E</th>
                  <th className="pb-2 font-medium">D</th>
                  <th className="pb-2 font-medium">Partidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {TIME_CLASSES.map((tc) => {
                  const m = modeStats(s, tc);
                  const r = m?.record;
                  return (
                    <tr key={tc} className="tabular-nums">
                      <td className="py-2 text-ink">{TIME_CLASS_LABEL[tc]}</td>
                      <td className="py-2 font-medium text-ink">{m?.last?.rating ?? '—'}</td>
                      <td className="py-2 text-ink-muted" title={m?.best ? new Date(m.best.date * 1000).toLocaleDateString('pt-BR') : undefined}>
                        {m?.best?.rating ?? '—'}
                      </td>
                      <td className="py-2 text-positive">{r?.win ?? '—'}</td>
                      <td className="py-2 text-ink-muted">{r?.draw ?? '—'}</td>
                      <td className="py-2 text-negative">{r?.loss ?? '—'}</td>
                      <td className="py-2 text-ink-muted">{r ? r.win + r.draw + r.loss : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-faint">
              <span>
                <SourceTag source="api" /> ratings e recordes oficiais
              </span>
              {imported && (
                <span>
                  <SourceTag source="calc" /> {imported.total} partidas importadas no Chess Lab · pontuação {imported.score}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
