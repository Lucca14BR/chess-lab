import { Fragment, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { ChartLine, ExternalLink, Activity, NotebookPen, ChessKnight, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { db, type Color, type ImportedGame, type TimeClass } from '@/lib/db/schema';
import { useAccount, useImportedGames, useStudyData } from '@/lib/hooks';
import { TIME_CLASS_LABEL, RESULT_LABELS, formatTimeControl, modeStats } from '@/lib/chesscom/normalize';
import { filterGames, monthly, PERIOD_LABEL, ratingSeries, statsBy, weekdayHourMatrix, weeklyCounts, wdl, currentStreak, periodStart, groupBy, type Period } from '@/lib/stats/games';
import { puzzlesPerDay, studyTimeByDay } from '@/lib/stats/study';
import { openingIdForFamily } from '@/lib/services/recommendations';
import { RESULT_WORD } from '@/lib/labels';
import { Page, PageHeader, Tabs } from '@/components/ui/Page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input, Segmented, Select } from '@/components/ui/Form';
import { EmptyState, LoadingBlock, Stat } from '@/components/ui/Feedback';
import { SourceTag } from '@/components/ui/Badge';
import { AXIS, RatingAreaChart, TooltipBox, WdlBar } from '@/components/charts/Charts';
import { ConnectChessCom } from '@/features/account/ConnectChessCom';
import { cn, formatDate, formatDuration, formatMonth, formatShortDate, normalizeText, WEEKDAYS_SHORT } from '@/lib/utils';

type TabId = 'geral' | 'partidas' | 'aberturas' | 'estudo';
const TCS: TimeClass[] = ['bullet', 'blitz', 'rapid', 'daily'];

export default function PerformancePage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('aba') as TabId) || 'geral';
  const account = useAccount();
  const games = useImportedGames();
  const [period, setPeriod] = useState<Period>('90d');
  const [tc, setTc] = useState<TimeClass | 'all'>('all');
  const [color, setColor] = useState<Color | 'all'>('all');
  const [ratedOnly, setRatedOnly] = useState(false);

  const filtered = useMemo(() => (games ? filterGames(games, { period, timeClass: tc, color, ratedOnly }) : []), [games, period, tc, color, ratedOnly]);

  const setTab = (t: TabId) => {
    const p = new URLSearchParams(params);
    p.set('aba', t);
    p.delete('busca');
    setParams(p);
  };

  const filters = (
    <Card className="mb-5 flex flex-wrap items-center gap-3 px-4 py-3">
      <Segmented<Period> size="sm" value={period} onChange={setPeriod} ariaLabel="Período" options={(Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({ value: p, label: PERIOD_LABEL[p] }))} />
      <Segmented<TimeClass | 'all'> size="sm" value={tc} onChange={setTc} ariaLabel="Controle de tempo" options={[{ value: 'all', label: 'Todos' }, ...TCS.map((t) => ({ value: t, label: TIME_CLASS_LABEL[t] }))]} />
      <Segmented<Color | 'all'>
        size="sm"
        value={color}
        onChange={setColor}
        ariaLabel="Cor"
        options={[
          { value: 'all', label: 'Ambas as cores' },
          { value: 'white', label: 'Brancas' },
          { value: 'black', label: 'Pretas' },
        ]}
      />
      <label className="flex items-center gap-2 text-xs text-ink-muted">
        <input type="checkbox" checked={ratedOnly} onChange={(e) => setRatedOnly(e.target.checked)} className="accent-[var(--positive)]" /> Só ranqueadas
      </label>
      <span className="ml-auto text-xs text-ink-faint tabular-nums">{filtered.length} partidas</span>
    </Card>
  );

  return (
    <Page>
      <PageHeader eyebrow="Aprendizado" title="Desempenho" description="Estatísticas calculadas a partir das suas partidas importadas do Chess.com e dos seus treinos no Chess Lab." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'geral', label: 'Visão geral' },
          { value: 'partidas', label: 'Partidas', count: games?.length },
          { value: 'aberturas', label: 'Aberturas' },
          { value: 'estudo', label: 'Estudo e puzzles' },
        ]}
      />
      {tab === 'estudo' ? (
        <StudyTab />
      ) : account === undefined || games === undefined ? (
        <LoadingBlock />
      ) : !account ? (
        <Card>
          <CardHeader icon={<ChartLine />} title="Conecte o Chess.com para ver suas estatísticas" />
          <CardBody>
            <ConnectChessCom compact />
          </CardBody>
        </Card>
      ) : games.length === 0 ? (
        <Card>
          <EmptyState icon={<ChartLine />} title="Nenhuma partida importada ainda" description="A sincronização pode estar em andamento. Acompanhe em Configurações." />
        </Card>
      ) : (
        <>
          {filters}
          {tab === 'geral' && <Overview games={filtered} all={games} tc={tc} period={period} stats={account.stats} />}
          {tab === 'partidas' && <GamesTab games={filtered} initialSearch={params.get('busca') ?? ''} />}
          {tab === 'aberturas' && <OpeningsTab games={filtered} />}
        </>
      )}
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function MonthTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { t: number; win: number; draw: number; loss: number; score: number };
  return (
    <TooltipBox title={new Date(p.t).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}>
      <div>
        <span className="text-positive">V {p.win}</span> · <span className="text-ink-muted">E {p.draw}</span> · <span className="text-negative">D {p.loss}</span>
      </div>
      <div className="text-ink-muted">Pontuação {p.score}%</div>
    </TooltipBox>
  );
}

function Overview({ games, all, tc, period, stats }: { games: ImportedGame[]; all: ImportedGame[]; tc: TimeClass | 'all'; period: Period; stats: NonNullable<ReturnType<typeof useAccount>>['stats'] }) {
  const w = wdl(games);
  const streak = currentStreak(games);
  const byCounts = TCS.filter((t) => all.some((g) => g.timeClass === t)).sort((a, b) => all.filter((g) => g.timeClass === b).length - all.filter((g) => g.timeClass === a).length);
  const [ratingTc, setRatingTc] = useState<TimeClass>(byCounts[0] ?? 'rapid');
  const activeTc = tc === 'all' ? ratingTc : tc;
  const start = periodStart(period);
  const series = ratingSeries(
    all.filter((g) => g.endTime >= start),
    activeTc,
  );
  const months = monthly(games);
  const weeks = weeklyCounts(games);
  const matrix = weekdayHourMatrix(games);
  const maxCell = Math.max(1, ...matrix.flat());
  const terminations = statsBy(games, (g) => g.resultDetail).slice(0, 8);
  const official = modeStats(stats, activeTc);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 lg:col-span-3">
        <Stat label="Partidas" value={w.total} sub={<SourceTag source="calc" />} />
        <Stat label="Pontuação" value={`${w.score}%`} sub="(V + E/2) / total" />
        <Stat label="V / E / D" value={<span className="text-xl"><span className="text-positive">{w.win}</span> / <span className="text-ink-muted">{w.draw}</span> / <span className="text-negative">{w.loss}</span></span>} />
        <Stat label="Sequência atual" value={streak ? `${streak.count} ${streak.result === 'win' ? 'vitória' : streak.result === 'loss' ? 'derrota' : 'empate'}${streak.count > 1 ? 's' : ''}` : '—'} sub="nas partidas filtradas" />
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader
          icon={<ChartLine />}
          title={`Evolução do rating — ${TIME_CLASS_LABEL[activeTc]}`}
          subtitle={<span>Rating registrado em cada partida ranqueada, último do dia <SourceTag source="calc" className="ml-1" /></span>}
          action={tc === 'all' && byCounts.length > 1 ? <Segmented size="sm" value={ratingTc} onChange={setRatingTc} options={byCounts.map((t) => ({ value: t, label: TIME_CLASS_LABEL[t] }))} ariaLabel="Modalidade do gráfico" /> : undefined}
        />
        <CardBody>
          {series.length >= 2 ? <RatingAreaChart data={series} height={260} /> : <EmptyState compact title="Dados insuficientes" description={`Menos de dois dias com partidas ranqueadas ${TIME_CLASS_LABEL[activeTc].toLowerCase()} no período.`} />}
          {official?.last && (
            <p className="mt-2 text-xs text-ink-muted">
              Rating oficial atual: <span className="text-ink">{official.last.rating}</span> · melhor: <span className="text-ink">{official.best?.rating ?? '—'}</span> <SourceTag source="api" className="ml-1" />
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Por cor" subtitle={<SourceTag source="calc" />} />
        <CardBody className="space-y-5">
          {(['white', 'black'] as const).map((c) => {
            const cw = wdl(games.filter((g) => g.userColor === c));
            return (
              <div key={c}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink">
                    <span className={cn('size-3 rounded-sm border border-line-strong', c === 'white' ? 'bg-[#efe6d6]' : 'bg-[#1a120c]')} />
                    {c === 'white' ? 'Brancas' : 'Pretas'}
                  </span>
                  <span className="text-ink-muted tabular-nums">
                    {cw.score}% · {cw.total} partidas
                  </span>
                </div>
                <WdlBar w={cw} />
                <p className="mt-1 text-[11px] text-ink-faint tabular-nums">
                  V {cw.win} · E {cw.draw} · D {cw.loss}
                </p>
              </div>
            );
          })}
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-xs tracking-wide text-ink-muted uppercase">Por controle de tempo</p>
            <table className="w-full text-sm tabular-nums">
              <tbody className="divide-y divide-line">
                {TCS.map((t) => {
                  const tw = wdl(games.filter((g) => g.timeClass === t));
                  if (!tw.total) return null;
                  return (
                    <tr key={t}>
                      <td className="py-1.5 text-ink">{TIME_CLASS_LABEL[t]}</td>
                      <td className="py-1.5 text-ink-muted">{tw.total}</td>
                      <td className="py-1.5 text-right text-ink-muted">
                        <span className="text-positive">{tw.win}</span>/{tw.draw}/<span className="text-negative">{tw.loss}</span>
                      </td>
                      <td className="py-1.5 text-right text-ink">{tw.score}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Histórico mensal" subtitle={<SourceTag source="calc" />} />
        <CardBody>
          {months.length ? (
            <BarChart responsive style={{ width: '100%', height: 240 }} data={months} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="t" tickFormatter={(t) => formatMonth(t)} {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip content={MonthTooltip} cursor={{ fill: 'var(--bg-hover)' }} />
              <Legend formatter={(v) => <span className="text-xs text-ink-muted">{v}</span>} iconSize={8} />
              <Bar dataKey="win" name="Vitórias" stackId="r" fill="var(--positive)" maxBarSize={36} />
              <Bar dataKey="draw" name="Empates" stackId="r" fill="var(--text-faint)" maxBarSize={36} />
              <Bar dataKey="loss" name="Derrotas" stackId="r" fill="var(--negative)" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          ) : (
            <EmptyState compact title="Sem partidas no período" />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Como as partidas terminam" subtitle={<SourceTag source="calc" />} />
        <CardBody>
          <ul className="space-y-2 text-sm">
            {terminations.map((t) => (
              <li key={t.key}>
                <div className="flex justify-between">
                  <span className="text-ink">{RESULT_LABELS[t.key] ?? t.key}</span>
                  <span className="text-xs text-ink-muted tabular-nums">{t.total}</span>
                </div>
                <WdlBar w={t} className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-ink-faint">Barras mostram seus resultados (V/E/D) em cada tipo de término.</p>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Frequência de partidas" subtitle="Partidas por semana" />
        <CardBody>
          <BarChart responsive style={{ width: '100%', height: 170 }} data={weeks} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
            <XAxis dataKey="t" tickFormatter={(t) => formatShortDate(t)} {...AXIS} minTickGap={30} />
            <YAxis {...AXIS} allowDecimals={false} />
            <Tooltip content={({ active, payload }) => (active && payload?.length ? <TooltipBox title={`Semana de ${formatDate((payload[0].payload as { t: number }).t)}`}>{(payload[0].payload as { count: number }).count} partidas</TooltipBox> : null)} cursor={{ fill: 'var(--bg-hover)' }} />
            <Bar dataKey="count" fill="var(--brass)" radius={[2, 2, 0, 0]} maxBarSize={20} />
          </BarChart>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Quando você joga" subtitle="Dia da semana × hora (horário local)" />
        <CardBody>
          <div className="overflow-x-auto">
            <div className="grid min-w-[320px] grid-cols-[2rem_repeat(24,minmax(0,1fr))] gap-[2px] text-[9px] text-ink-faint">
              <span />
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="text-center">
                  {h % 6 === 0 ? h : ''}
                </span>
              ))}
              {matrix.map((row, d) => (
                <div key={d} className="contents">
                  <span className="pr-1 text-right leading-[14px]">{WEEKDAYS_SHORT[d]}</span>
                  {row.map((n, h) => (
                    <span key={h} title={`${WEEKDAYS_SHORT[d]} ${h}h: ${n} partidas`} className="h-3.5 rounded-[2px]" style={{ background: n ? `color-mix(in srgb, var(--positive) ${Math.round(15 + (n / maxCell) * 85)}%, transparent)` : 'var(--bg-sunken)' }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GamesTab({ games, initialSearch }: { games: ImportedGame[]; initialSearch: string }) {
  const [q, setQ] = useState(initialSearch);
  const [result, setResult] = useState<'all' | 'win' | 'draw' | 'loss'>('all');
  const [limit, setLimit] = useState(50);
  const analyzed = useLiveQuery(async () => new Set((await db.analyses.where('kind').equals('chesscom').toArray()).map((a) => a.gameId)), []);
  const nq = normalizeText(q.trim());
  const list = games.filter((g) => (result === 'all' || g.result === result) && (!nq || normalizeText(`${g.opponent} ${g.openingName ?? ''} ${g.eco ?? ''}`).includes(nq))).sort((a, b) => b.endTime - a.endTime);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Adversário, abertura ou ECO" className="pl-9" aria-label="Buscar partidas" />
        </div>
        <div className="w-44"><Select value={result} onChange={(e) => setResult(e.target.value as typeof result)} aria-label="Resultado">
          <option value="all">Todos os resultados</option>
          <option value="win">Vitórias</option>
          <option value="draw">Empates</option>
          <option value="loss">Derrotas</option>
        </Select></div>
        <span className="text-xs text-ink-faint tabular-nums">{list.length} partidas</span>
      </div>
      {list.length === 0 ? (
        <EmptyState compact title="Nenhuma partida com esses filtros" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm [&_td]:px-3 [&_th]:px-3">
            <thead>
              <tr className="border-b border-line text-left text-[11px] tracking-wide text-ink-muted uppercase">
                <th className="px-4 py-2.5 font-medium">Data</th>
                <th className="px-4 py-2.5 font-medium">Adversário</th>
                <th className="px-4 py-2.5 font-medium">Resultado</th>
                <th className="px-4 py-2.5 font-medium">Ritmo</th>
                <th className="px-4 py-2.5 font-medium">Abertura</th>
                <th className="px-4 py-2.5 font-medium">Seu rating</th>
                <th className="px-4 py-2.5 font-medium" title="Precisão informada pelo Chess.com, quando a partida foi revisada lá">Precisão</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, limit).map((g) => (
                <tr key={g.id} className="hover:bg-hover">
                  <td className="px-4 py-2 whitespace-nowrap text-ink-muted tabular-nums">{formatDate(g.endTime)}</td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <span className={cn('size-2.5 shrink-0 rounded-sm border border-line-strong', g.userColor === 'white' ? 'bg-[#efe6d6]' : 'bg-[#1a120c]')} title={g.userColor === 'white' ? 'Você jogou de brancas' : 'Você jogou de pretas'} />
                      <span className="text-ink">{g.opponent}</span>
                      {g.opponentRating != null && <span className="text-xs text-ink-faint tabular-nums">({g.opponentRating})</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn('font-medium', g.result === 'win' ? 'text-positive' : g.result === 'loss' ? 'text-negative' : 'text-ink-muted')}>{RESULT_WORD[g.result]}</span>
                    <span className="ml-1.5 text-xs text-ink-faint">{RESULT_LABELS[g.resultDetail] ?? g.resultDetail}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-ink-muted">
                    {TIME_CLASS_LABEL[g.timeClass]} · {formatTimeControl(g.timeControl)}
                    {!g.rated && <span className="ml-1 text-xs text-ink-faint">(amistosa)</span>}
                  </td>
                  <td className="max-w-56 truncate px-4 py-2 text-ink-muted" title={g.openingName ?? undefined}>
                    {g.eco && <span className="mr-1 font-mono text-xs text-ink-faint">{g.eco}</span>}
                    {g.openingName ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-ink tabular-nums">{g.userRating ?? '—'}</td>
                  <td className="px-4 py-2 text-ink-muted tabular-nums">{g.accuracies ? `${(g.userColor === 'white' ? g.accuracies.white : g.accuracies.black).toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-0.5">
                      <ButtonLink to={`/tabuleiro?partida=${encodeURIComponent(g.id)}`} title="Abrir no Tabuleiro" size="icon-sm" variant="ghost" aria-label="Abrir no Tabuleiro">
                          <ChessKnight />
                        </ButtonLink>
                      <ButtonLink to={`/tabuleiro?partida=${encodeURIComponent(g.id)}&analisar=1`} title={analyzed?.has(g.id) ? 'Ver análise' : 'Analisar com Stockfish'} size="icon-sm" variant="ghost" aria-label="Analisar">
                          <Activity className={analyzed?.has(g.id) ? 'text-positive' : ''} />
                        </ButtonLink>
                      <ButtonLink to={`/caderno?partida=${encodeURIComponent(g.id)}`} title="Criar nota sobre a partida" size="icon-sm" variant="ghost" aria-label="Criar nota">
                          <NotebookPen />
                        </ButtonLink>
                      <ButtonLink href={g.url} title="Ver no Chess.com" size="icon-sm" variant="ghost" aria-label="Ver no Chess.com">
                          <ExternalLink />
                        </ButtonLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.length > limit && (
        <div className="border-t border-line p-3 text-center">
          <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + 100)}>
            Mostrar mais ({list.length - limit} restantes)
          </Button>
        </div>
      )}
      <p className="border-t border-line px-4 py-2 text-[11px] text-ink-faint">
        <SourceTag source="api" /> Dados das partidas: Chess.com. Abertura derivada do campo ECO/ECOUrl do PGN.
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function OpeningsTab({ games }: { games: ImportedGame[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [side, setSide] = useState<Color>('white');
  const mine = games.filter((g) => g.userColor === side);
  const fams = statsBy(mine, (g) => g.openingFamily ?? 'Desconhecida');
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <Segmented
          size="sm"
          value={side}
          onChange={setSide}
          ariaLabel="Cor"
          options={[
            { value: 'white', label: 'Com brancas' },
            { value: 'black', label: 'Com pretas' },
          ]}
        />
        <span className="text-[11px] text-ink-faint">
          <SourceTag source="calc" /> Agrupamento por família a partir do nome de abertura do Chess.com
        </span>
      </div>
      {fams.length === 0 ? (
        <EmptyState compact title="Sem partidas com essa cor no filtro atual" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] tracking-wide text-ink-muted uppercase">
                <th className="px-4 py-2.5 font-medium">Abertura</th>
                <th className="px-4 py-2.5 font-medium">Partidas</th>
                <th className="px-4 py-2.5 font-medium">V / E / D</th>
                <th className="w-48 px-4 py-2.5 font-medium">Resultados</th>
                <th className="px-4 py-2.5 font-medium">Pontuação</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {fams.map((f) => {
                const oid = openingIdForFamily(f.key);
                const variants = open === f.key ? statsBy([...(groupBy(mine, (g) => g.openingFamily ?? 'Desconhecida').get(f.key) ?? [])], (g) => g.openingName ?? 'Desconhecida') : [];
                return (
                  <Fragment key={f.key}>
                    <tr className="hover:bg-hover">
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => setOpen(open === f.key ? null : f.key)} className="flex items-center gap-1.5 text-left text-ink" aria-expanded={open === f.key}>
                          {open === f.key ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                          {f.key}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-ink-muted">{f.total}</td>
                      <td className="px-4 py-2 text-ink-muted">
                        <span className="text-positive">{f.win}</span> / {f.draw} / <span className="text-negative">{f.loss}</span>
                      </td>
                      <td className="px-4 py-2">
                        <WdlBar w={f} />
                      </td>
                      <td className={cn('px-4 py-2', f.total >= 5 && f.score < 40 ? 'text-negative' : f.total >= 5 && f.score >= 60 ? 'text-positive' : 'text-ink')}>{f.score}%</td>
                      <td className="px-4 py-2 text-right">
                        {oid && (
                          <Link to={`/aberturas/${oid}`} className="text-xs text-brass hover:underline">
                            Estudar
                          </Link>
                        )}
                      </td>
                    </tr>
                    {variants.map((v) => (
                      <tr key={v.key} className="bg-sunken/50 text-xs">
                        <td className="py-1.5 pr-4 pl-10 text-ink-muted">{v.key}</td>
                        <td className="px-4 py-1.5 text-ink-faint">{v.total}</td>
                        <td className="px-4 py-1.5 text-ink-faint">
                          {v.win} / {v.draw} / {v.loss}
                        </td>
                        <td className="px-4 py-1.5">
                          <WdlBar w={v} className="h-1.5" />
                        </td>
                        <td className="px-4 py-1.5 text-ink-muted">{v.score}%</td>
                        <td />
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-line px-4 py-2 text-[11px] text-ink-faint">Amostras pequenas (menos de 5 partidas) não são destacadas: a pontuação ainda não é confiável.</p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function StudyTab() {
  const study = useStudyData();
  const analyses = useLiveQuery(() => db.analyses.orderBy('createdAt').toArray(), []);
  const games = useImportedGames();
  if (!study) return <LoadingBlock />;
  const perDay = puzzlesPerDay(study.attempts);
  // acurácia móvel dos últimos 20
  const sorted = [...study.attempts].sort((a, b) => a.date - b.date);
  const rolling = sorted.map((a, i) => {
    const win = sorted.slice(Math.max(0, i - 19), i + 1);
    return { n: i + 1, t: a.date, acc: Math.round((win.filter((x) => x.solved).length / win.length) * 100), rating: a.rating };
  });
  const time = studyTimeByDay(study.sessions, study.activity).map((d) => ({ ...d, t: new Date(d.day).getTime(), sessions: Math.round(d.sessions / 60000), puzzles: Math.round(d.puzzles / 60000), lessons: Math.round(d.lessons / 60000), other: Math.round(d.other / 60000) }));
  const totalMs = studyTimeByDay(study.sessions, study.activity).reduce((s, d) => s + d.sessions + d.puzzles + d.lessons + d.other, 0);
  const completed = study.lessons.filter((l) => l.status === 'completed').length;
  const userAnalyses = (analyses ?? [])
    .map((a) => {
      const g = games?.find((x) => x.id === a.gameId);
      const color = g?.userColor;
      return color ? { t: a.createdAt, accuracy: a[color].accuracy, blunders: a[color].blunders } : null;
    })
    .filter((x) => x !== null);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 lg:col-span-2">
        <Stat label="Tempo de estudo" value={formatDuration(totalMs)} sub={<SourceTag source="manual" />} />
        <Stat label="Sessões de treino" value={study.sessions.length} />
        <Stat label="Puzzles tentados" value={study.attempts.length} sub={`${study.attempts.filter((a) => a.solved).length} resolvidos`} />
        <Stat label="Aulas concluídas" value={completed} />
      </Card>
      <Card>
        <CardHeader title="Evolução nos puzzles" subtitle={<span>Taxa de acerto móvel (últimas 20 tentativas) <SourceTag source="calc" className="ml-1" /></span>} />
        <CardBody>
          {rolling.length >= 3 ? (
            <LineChart responsive style={{ width: '100%', height: 220 }} data={rolling} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="n" {...AXIS} />
              <YAxis domain={[0, 100]} unit="%" {...AXIS} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <TooltipBox title={`Tentativa ${(payload[0].payload as { n: number }).n}`}>{(payload[0].payload as { acc: number }).acc}% de acerto</TooltipBox> : null)} />
              <Line dataKey="acc" stroke="var(--positive)" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          ) : (
            <EmptyState compact title="Poucas tentativas" description="Resolva ao menos 3 puzzles para ver a curva." />
          )}
          {perDay.length > 0 && <p className="mt-2 text-xs text-ink-muted">{perDay.length} dias com puzzles · média de {(study.attempts.length / perDay.length).toFixed(1)} por dia ativo</p>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Tempo dedicado aos estudos" subtitle="Minutos por dia, por origem" />
        <CardBody>
          {time.length ? (
            <BarChart responsive style={{ width: '100%', height: 220 }} data={time.slice(-45)} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="t" tickFormatter={(t) => formatShortDate(t)} {...AXIS} minTickGap={24} />
              <YAxis {...AXIS} unit="m" allowDecimals={false} />
              <Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const p = payload[0].payload as (typeof time)[number]; return <TooltipBox title={formatDate(p.t)}><div>Sessões: {p.sessions} min</div><div>Puzzles: {p.puzzles} min</div><div>Aulas: {p.lessons} min</div></TooltipBox>; }} cursor={{ fill: 'var(--bg-hover)' }} />
              <Legend formatter={(v) => <span className="text-xs text-ink-muted">{v}</span>} iconSize={8} />
              <Bar dataKey="sessions" name="Sessões" stackId="s" fill="var(--positive)" maxBarSize={18} />
              <Bar dataKey="puzzles" name="Puzzles" stackId="s" fill="var(--brass)" maxBarSize={18} />
              <Bar dataKey="lessons" name="Aulas" stackId="s" fill="var(--info)" radius={[2, 2, 0, 0]} maxBarSize={18} />
            </BarChart>
          ) : (
            <EmptyState compact title="Nenhum tempo registrado" description="Sessões do Centro de Treino, puzzles e aulas contam aqui." />
          )}
          <p className="mt-2 text-[11px] text-ink-faint">Puzzles e aulas feitos durante uma sessão cronometrada não são somados duas vezes.</p>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Suas partidas analisadas" subtitle={<span>Precisão estimada pelo Stockfish no Chess Lab <SourceTag source="calc" className="ml-1" /></span>} />
        <CardBody>
          {userAnalyses.length === 0 ? (
            <EmptyState compact title="Nenhuma partida analisada" description="Em Desempenho › Partidas, use o botão de análise em uma partida importada." />
          ) : (
            <div className="flex flex-wrap gap-6">
              <Stat label="Partidas analisadas" value={userAnalyses.length} />
              <Stat label="Precisão média" value={`${(userAnalyses.reduce((s, a) => s + a.accuracy, 0) / userAnalyses.length).toFixed(1)}%`} />
              <Stat label="Erros graves por partida" value={(userAnalyses.reduce((s, a) => s + a.blunders, 0) / userAnalyses.length).toFixed(1)} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
