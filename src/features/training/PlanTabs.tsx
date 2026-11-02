import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight, Plus, Trash2, Play, Check, Minus, Flame, CalendarDays, Target, History as HistoryIcon } from 'lucide-react';
import { db, type ActivityType, type GoalMetric, type PlannedActivity } from '@/lib/db/schema';
import { useImportedGames, useStudyData, type StudyData } from '@/lib/hooks';
import { ACTIVITY_TYPES, GOAL_METRICS } from '@/lib/labels';
import { sessionRunner, sessionStore } from '@/lib/services/sessionRunner';
import { useStore } from '@/lib/store';
import { activeDaysSet, currentWeekIso, goalProgress, studyStreak, studyTimeByDay, weekBounds } from '@/lib/stats/study';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { EmptyState, LoadingBlock, ProgressBar, Stat } from '@/components/ui/Feedback';
import { Badge, SourceTag } from '@/components/ui/Badge';
import { Dialog, confirm, toast } from '@/components/ui/Dialog';
import { AXIS, TooltipBox } from '@/components/charts/Charts';
import { addDays, cn, formatDateTime, formatDuration, formatShortDate, isoDay, parseIsoDay, startOfWeek, uid, WEEKDAYS_SHORT } from '@/lib/utils';

const TYPES = Object.keys(ACTIVITY_TYPES) as ActivityType[];

/* --------------------------- Plano semanal --------------------------- */

export function WeekPlanTab() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek());
  const [adding, setAdding] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => isoDay(addDays(weekStart, i)));
  const planned = useLiveQuery(() => db.planned.where('day').between(days[0], days[6], true, true).toArray(), [days[0]]);
  const running = useStore(sessionStore).running;
  const today = isoDay();

  return (
    <Card>
      <CardHeader
        icon={<CalendarDays />}
        title="Planejamento semanal"
        subtitle={`${parseIsoDay(days[0]).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} – ${parseIsoDay(days[6]).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`}
        action={
          <div className="flex gap-1">
            <Button size="icon-sm" variant="ghost" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Semana anterior">
              <ChevronLeft />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setWeekStart(startOfWeek())}>
              Hoje
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Próxima semana">
              <ChevronRight />
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-7 md:divide-x md:divide-y-0">
        {days.map((d, i) => {
          const items = (planned ?? []).filter((p) => p.day === d).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
          const mins = items.reduce((s, p) => s + p.minutes, 0);
          return (
            <div key={d} className={cn('flex min-h-48 flex-col p-2.5', d === today && 'bg-accent-soft/50')}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className={cn('text-xs font-medium', d === today ? 'text-brass' : 'text-ink-muted')}>
                  {WEEKDAYS_SHORT[i]} {parseIsoDay(d).getDate()}
                </span>
                {mins > 0 && <span className="text-[10px] text-ink-faint tabular-nums">{mins} min</span>}
              </div>
              <ul className="flex-1 space-y-1.5">
                {items.map((p) => (
                  <PlannedItem key={p.id} p={p} canStart={!running} />
                ))}
              </ul>
              <button type="button" onClick={() => setAdding(d)} className="mt-2 flex items-center justify-center gap-1 rounded border border-dashed border-line py-1 text-xs text-ink-faint hover:border-line-strong hover:text-ink">
                <Plus className="size-3" /> Adicionar
              </button>
            </div>
          );
        })}
      </div>
      <AddPlannedDialog day={adding} onClose={() => setAdding(null)} />
    </Card>
  );
}

function PlannedItem({ p, canStart }: { p: PlannedActivity; canStart: boolean }) {
  return (
    <li className={cn('group rounded border px-2 py-1.5 text-xs', p.done ? 'border-positive/30 bg-positive-soft' : 'border-line bg-sunken')}>
      <div className="flex items-start gap-1.5">
        <button type="button" onClick={() => void db.planned.update(p.id, { done: !p.done })} aria-label={p.done ? 'Marcar como pendente' : 'Marcar como concluída'} aria-pressed={p.done} className={cn('mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border', p.done ? 'border-positive bg-positive text-accent-fg' : 'border-line-strong')}>
          {p.done && <Check className="size-2.5" />}
        </button>
        <span className="min-w-0 flex-1">
          <span className={cn('block leading-snug text-ink', p.done && 'line-through opacity-70')}>{p.title}</span>
          <span className="block text-[10px] text-ink-faint">
            {p.time ? `${p.time} · ` : ''}
            {p.minutes} min
          </span>
        </span>
      </div>
      <div className="mt-1 flex justify-end gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {!p.done && canStart && (
          <Button size="icon-sm" variant="ghost" aria-label="Iniciar como sessão" title="Iniciar como sessão cronometrada" onClick={() => sessionRunner.start([{ type: p.type, minutes: p.minutes, label: p.title }], p.id)}>
            <Play />
          </Button>
        )}
        <Button size="icon-sm" variant="ghost" aria-label="Excluir atividade" onClick={() => void db.planned.delete(p.id)}>
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

function AddPlannedDialog({ day, onClose }: { day: string | null; onClose: () => void }) {
  const [type, setType] = useState<ActivityType>('puzzles');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [minutes, setMinutes] = useState(20);
  const save = async () => {
    if (!day) return;
    await db.planned.add({ id: uid(), day, time: time || null, type, title: title.trim() || ACTIVITY_TYPES[type].label, minutes, done: false, createdAt: Date.now() });
    setTitle('');
    setTime('');
    onClose();
  };
  return (
    <Dialog
      open={!!day}
      onClose={onClose}
      title="Nova atividade"
      description={day ? parseIsoDay(day).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Tipo" htmlFor="pa-type">
          <Select id="pa-type" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPES[t].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Descrição" htmlFor="pa-title">
          <Input id="pa-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Ex.: ${ACTIVITY_TYPES[type].label}`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Horário (opcional)" htmlFor="pa-time">
            <Input id="pa-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Duração (min)" htmlFor="pa-min">
            <Input id="pa-min" type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(240, Number(e.target.value) || 5)))} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

/* ----------------------------- Calendário ----------------------------- */

export function CalendarTab() {
  const study = useStudyData();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(isoDay());
  if (!study) return <LoadingBlock />;
  const byDay = new Map(studyTimeByDay(study.sessions, study.activity).map((d) => [d.day, d.sessions + d.puzzles + d.lessons + d.other]));
  const first = startOfWeek(month);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const maxMs = Math.max(1, ...byDay.values());
  const today = isoDay();
  const selSessions = selected ? study.sessions.filter((s) => isoDay(s.startedAt) === selected) : [];
  const selPlanned = selected ? study.planned.filter((p) => p.day === selected) : [];
  const selPuzzles = selected ? study.attempts.filter((a) => isoDay(a.date) === selected) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader
          icon={<CalendarDays />}
          title={month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          action={
            <div className="flex gap-1">
              <Button size="icon-sm" variant="ghost" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="Mês anterior">
                <ChevronLeft />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label="Próximo mês">
                <ChevronRight />
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-faint">
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w} className="pb-1">
                {w}
              </span>
            ))}
            {cells.map((d) => {
              const key = isoDay(d);
              const ms = byDay.get(key) ?? 0;
              const plannedN = study.planned.filter((p) => p.day === key && !p.done).length;
              const inMonth = d.getMonth() === month.getMonth();
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={selected === key}
                  aria-label={`${d.toLocaleDateString('pt-BR')}: ${formatDuration(ms)} de estudo`}
                  className={cn('relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs', selected === key ? 'border-brass' : 'border-transparent hover:border-line', !inMonth && 'opacity-35')}
                  style={{ background: ms ? `color-mix(in srgb, var(--positive) ${Math.round(12 + (ms / maxMs) * 60)}%, transparent)` : 'var(--bg-sunken)' }}
                >
                  <span className={cn(key === today ? 'font-semibold text-brass' : 'text-ink')}>{d.getDate()}</span>
                  {plannedN > 0 && <span className="absolute bottom-1 size-1 rounded-full bg-brass" />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-ink-faint">Cor = tempo de estudo registrado no dia. Ponto dourado = atividade planejada pendente.</p>
        </CardBody>
      </Card>
      <Card className="self-start">
        <CardHeader title={selected ? parseIsoDay(selected).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'Selecione um dia'} />
        <CardBody className="space-y-3 text-sm">
          {selected && (
            <>
              <p className="text-ink-muted">
                Tempo de estudo: <span className="text-ink">{formatDuration(byDay.get(selected) ?? 0)}</span>
              </p>
              <div>
                <p className="mb-1 text-xs tracking-wide text-ink-muted uppercase">Sessões</p>
                {selSessions.length ? selSessions.map((s) => <p key={s.id} className="text-ink">{formatDuration(s.totalMs)} · {s.blocks.filter((b) => b.done).length}/{s.blocks.length} blocos</p>) : <p className="text-xs text-ink-faint">Nenhuma.</p>}
              </div>
              <div>
                <p className="mb-1 text-xs tracking-wide text-ink-muted uppercase">Planejado</p>
                {selPlanned.length ? selPlanned.map((p) => <p key={p.id} className={cn('text-ink', p.done && 'line-through opacity-60')}>{p.time ? `${p.time} · ` : ''}{p.title}</p>) : <p className="text-xs text-ink-faint">Nada planejado.</p>}
              </div>
              <div>
                <p className="mb-1 text-xs tracking-wide text-ink-muted uppercase">Puzzles</p>
                <p className="text-ink">{selPuzzles.length ? `${selPuzzles.filter((a) => a.solved).length} de ${selPuzzles.length} resolvidos` : <span className="text-xs text-ink-faint">Nenhum.</span>}</p>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* -------------------------------- Metas -------------------------------- */

export function GoalsTab() {
  const study = useStudyData();
  const games = useImportedGames();
  const [open, setOpen] = useState(false);
  const week = currentWeekIso();
  if (!study) return <LoadingBlock />;
  const { start, end } = weekBounds(week);
  const input = { attempts: study.attempts, lessons: study.lessons, sessions: study.sessions, activity: study.activity, gamesInWeek: (games ?? []).filter((g) => g.endTime >= start && g.endTime < end).length };
  const current = study.goals.filter((g) => g.week === week || g.week === 'recorrente');
  const past = study.goals.filter((g) => g.week !== week && g.week !== 'recorrente');

  const bump = async (id: string, delta: number) => {
    const g = await db.goals.get(id);
    if (!g) return;
    const v = Math.max(0, (g.manualProgress[week] ?? 0) + delta);
    await db.goals.update(id, { manualProgress: { ...g.manualProgress, [week]: v } });
  };

  return (
    <Card>
      <CardHeader icon={<Target />} title="Metas da semana" subtitle="O progresso das metas automáticas é calculado a partir do que você registra aqui." action={<Button size="sm" variant="primary" onClick={() => setOpen(true)}><Plus /> Nova meta</Button>} />
      <CardBody>
        {current.length === 0 ? (
          <EmptyState compact icon={<Target />} title="Nenhuma meta definida" description="Exemplos: resolver 50 puzzles, estudar 120 minutos, concluir 2 aulas." action={<Button variant="primary" onClick={() => setOpen(true)}>Criar meta</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {current.map((g) => {
              const value = goalProgress(g, week, input);
              const meta = GOAL_METRICS[g.metric];
              return (
                <li key={g.id} className={cn('flex flex-wrap items-center gap-4 py-3', !g.active && 'opacity-50')}>
                  <div className="min-w-48 flex-1">
                    <p className="text-sm text-ink">
                      {g.title}
                      {g.week === 'recorrente' && <Badge className="ml-2">toda semana</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {meta.label} <SourceTag source={meta.auto ? 'calc' : 'manual'} className="ml-1" />
                    </p>
                  </div>
                  <div className="w-48">
                    <div className="mb-1 flex justify-between text-xs tabular-nums">
                      <span className={value >= g.target ? 'text-positive' : 'text-ink'}>
                        {value} / {g.target} {meta.unit}
                      </span>
                      <span className="text-ink-faint">{Math.min(100, Math.round((value / g.target) * 100))}%</span>
                    </div>
                    <ProgressBar value={value} max={g.target} />
                  </div>
                  <div className="flex gap-1">
                    {!meta.auto && (
                      <>
                        <Button size="icon-sm" variant="ghost" onClick={() => void bump(g.id, -1)} aria-label="Diminuir">
                          <Minus />
                        </Button>
                        <Button size="icon-sm" onClick={() => void bump(g.id, 1)} aria-label="Registrar +1">
                          <Plus />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => void db.goals.update(g.id, { active: !g.active })}>
                      {g.active ? 'Pausar' : 'Reativar'}
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Excluir meta" onClick={async () => (await confirm({ title: 'Excluir meta?', message: `“${g.title}” será removida.`, confirmLabel: 'Excluir', danger: true })) && db.goals.delete(g.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {past.length > 0 && (
          <details className="mt-4 border-t border-line pt-3">
            <summary className="cursor-pointer text-xs text-ink-muted">Metas de semanas anteriores ({past.length})</summary>
            <ul className="mt-2 space-y-1 text-xs">
              {past.map((g) => (
                <li key={g.id} className="flex justify-between text-ink-muted">
                  <span>
                    {g.title} · semana de {parseIsoDay(g.week).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="tabular-nums">
                    {goalProgress(g, g.week, input)} / {g.target}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardBody>
      <NewGoalDialog open={open} onClose={() => setOpen(false)} week={week} />
    </Card>
  );
}

function NewGoalDialog({ open, onClose, week }: { open: boolean; onClose: () => void; week: string }) {
  const [metric, setMetric] = useState<GoalMetric>('puzzles_solved');
  const [target, setTarget] = useState(30);
  const [title, setTitle] = useState('');
  const [recurring, setRecurring] = useState(true);
  const save = async () => {
    const meta = GOAL_METRICS[metric];
    await db.goals.add({ id: uid(), title: title.trim() || `${meta.label}: ${target}`, metric, target: Math.max(1, target), week: recurring ? 'recorrente' : week, manualProgress: {}, active: true, createdAt: Date.now() });
    setTitle('');
    onClose();
    toast('Meta criada.', 'positive');
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nova meta"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            Criar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="O que medir" htmlFor="g-metric" hint={GOAL_METRICS[metric].auto ? 'Calculado automaticamente.' : 'Você registra o progresso com os botões + e −.'}>
          <Select id="g-metric" value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
            {(Object.keys(GOAL_METRICS) as GoalMetric[]).map((m) => (
              <option key={m} value={m}>
                {GOAL_METRICS[m].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`Meta (${GOAL_METRICS[metric].unit})`} htmlFor="g-target">
          <Input id="g-target" type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value) || 1)} />
        </Field>
        <Field label="Título" htmlFor="g-title">
          <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Estudar 5 aberturas esta semana" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-[var(--positive)]" /> Repetir todas as semanas
        </label>
      </div>
    </Dialog>
  );
}

/* ------------------------------- Histórico ------------------------------- */

export function HistoryTab() {
  const study = useStudyData();
  const weekly = useMemo(() => {
    if (!study) return [];
    const days = studyTimeByDay(study.sessions, study.activity);
    const w0 = startOfWeek();
    return Array.from({ length: 8 }, (_, i) => {
      const ws = addDays(w0, -7 * (7 - i));
      const we = addDays(ws, 7);
      const ms = days.filter((d) => parseIsoDay(d.day) >= ws && parseIsoDay(d.day) < we).reduce((s, d) => s + d.sessions + d.puzzles + d.lessons + d.other, 0);
      return { t: ws.getTime(), min: Math.round(ms / 60000) };
    });
  }, [study]);
  if (!study) return <LoadingBlock />;
  const active = activeDaysSet(study.sessions, study.activity, study.attempts);
  const streak = studyStreak(active);
  const last28 = Array.from({ length: 28 }, (_, i) => isoDay(addDays(new Date(), i - 27)));
  const activeIn28 = last28.filter((d) => active.has(d)).length;
  const sessions = [...study.sessions].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card>
          <CardHeader icon={<Flame />} title="Consistência" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Sequência atual" value={`${streak} dia${streak === 1 ? '' : 's'}`} />
              <Stat label="Dias ativos (28)" value={`${activeIn28}/28`} />
            </div>
            <div className="grid grid-cols-7 gap-1" aria-label="Últimos 28 dias">
              {last28.map((d) => (
                <span key={d} title={parseIsoDay(d).toLocaleDateString('pt-BR')} className={cn('aspect-square rounded-sm', active.has(d) ? 'bg-positive' : 'bg-sunken')} />
              ))}
            </div>
            <p className="text-[11px] text-ink-faint">Um dia conta como ativo quando há sessão, puzzle, aula ou análise registrada.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Minutos por semana" subtitle="Últimas 8 semanas" />
          <CardBody>
            <BarChart responsive style={{ width: '100%', height: 150 }} data={weekly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="t" tickFormatter={(t) => formatShortDate(t)} {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip content={({ active: a, payload }) => (a && payload?.length ? <TooltipBox title={`Semana de ${formatShortDate((payload[0].payload as { t: number }).t)}`}>{(payload[0].payload as { min: number }).min} min</TooltipBox> : null)} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="min" fill="var(--positive)" radius={[2, 2, 0, 0]} maxBarSize={26} />
            </BarChart>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader icon={<HistoryIcon />} title="Sessões registradas" subtitle={`${sessions.length} no total · ${formatDuration(sessions.reduce((s, x) => s + x.totalMs, 0))}`} />
        {sessions.length === 0 ? (
          <EmptyState compact title="Nenhuma sessão ainda" description="Monte e inicie uma sessão na aba Sessão." />
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SessionRow({ s }: { s: StudyData['sessions'][number] }) {
  return (
    <li className="flex flex-wrap items-start gap-4 px-5 py-3">
      <div className="min-w-40">
        <p className="text-sm text-ink">{formatDateTime(s.startedAt)}</p>
        <p className="text-xs text-ink-muted">
          {formatDuration(s.totalMs)} · {s.status === 'completed' ? 'concluída' : 'parcial'}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {s.blocks.map((b, i) => (
            <Badge key={i} tone={b.done ? 'positive' : 'neutral'}>
              {b.label} · {formatDuration(b.actualMs)}
            </Badge>
          ))}
        </div>
        {s.notes && <p className="mt-1.5 text-xs text-ink-muted">{s.notes}</p>}
      </div>
      <Button size="icon-sm" variant="ghost" aria-label="Excluir sessão" onClick={async () => (await confirm({ title: 'Excluir sessão?', message: 'O registro desta sessão será removido do histórico.', confirmLabel: 'Excluir', danger: true })) && db.sessions.delete(s.id)}>
        <Trash2 />
      </Button>
    </li>
  );
}
