import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, Pause, SkipForward, Check, Plus, Trash2, ArrowUp, ArrowDown, Save, Square, Lightbulb, ArrowRight, X } from 'lucide-react';
import { db, type ActivityType } from '@/lib/db/schema';
import { useStore } from '@/lib/store';
import { sessionRunner, sessionStore, currentBlockElapsed } from '@/lib/services/sessionRunner';
import { ACTIVITY_TYPES } from '@/lib/labels';
import { buildRecommendations } from '@/lib/services/recommendations';
import { useImportedGames, useStudyData } from '@/lib/hooks';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Form';
import { EmptyState, ProgressBar } from '@/components/ui/Feedback';
import { SourceTag } from '@/components/ui/Badge';
import { confirm, toast } from '@/components/ui/Dialog';
import { cn, formatClock, uid } from '@/lib/utils';

export interface DraftBlock {
  type: ActivityType;
  minutes: number;
  label: string;
}

const TYPES = Object.keys(ACTIVITY_TYPES) as ActivityType[];

/** Modelos de partida — pontos de partida editáveis, não uma rotina obrigatória. */
const PRESETS: Array<{ name: string; blocks: DraftBlock[] }> = [
  {
    name: 'Equilibrada (70 min)',
    blocks: [
      { type: 'puzzles', minutes: 15, label: 'Puzzles' },
      { type: 'abertura', minutes: 20, label: 'Repertório de aberturas' },
      { type: 'analise', minutes: 20, label: 'Análise de partidas' },
      { type: 'finais', minutes: 15, label: 'Finais' },
    ],
  },
  {
    name: 'Tática rápida (25 min)',
    blocks: [
      { type: 'puzzles', minutes: 20, label: 'Puzzles' },
      { type: 'livre', minutes: 5, label: 'Anotar padrões no caderno' },
    ],
  },
  {
    name: 'Revisão de partidas (45 min)',
    blocks: [
      { type: 'analise', minutes: 30, label: 'Analisar últimas partidas' },
      { type: 'livre', minutes: 15, label: 'Registrar erros recorrentes' },
    ],
  },
];

export function SessionTab() {
  const run = useStore(sessionStore);
  return run.running ? <Runner /> : <Builder />;
}

function Builder() {
  const [blocks, setBlocks] = useState<DraftBlock[]>(PRESETS[0].blocks);
  const templates = useLiveQuery(() => db.templates.orderBy('createdAt').toArray(), []);
  const study = useStudyData();
  const games = useImportedGames();
  const analyses = useLiveQuery(() => db.analyses.toArray(), []);
  const recs = study ? buildRecommendations({ games: games ?? [], attempts: study.attempts, lessons: study.lessons, analyses: analyses ?? [] }).slice(0, 4) : [];
  const total = blocks.reduce((s, b) => s + b.minutes, 0);

  const update = (i: number, patch: Partial<DraftBlock>) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i: number, d: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + d;
      if (j < 0 || j >= bs.length) return bs;
      const c = [...bs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const [naming, setNaming] = useState<string | null>(null);
  const saveTemplate = async () => {
    if (!naming?.trim()) return setNaming(null);
    await db.templates.add({ id: uid(), name: naming.trim(), blocks, createdAt: Date.now() });
    setNaming(null);
    toast('Modelo salvo.', 'positive');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader title="Montar sessão" subtitle={`${blocks.length} blocos · ${total} min`} action={
            naming === null ? (
              <Button size="sm" variant="ghost" onClick={() => setNaming('')} disabled={!blocks.length}>
                <Save /> Salvar como modelo
              </Button>
            ) : (
              <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); void saveTemplate(); }}>
                <Input value={naming} onChange={(e) => setNaming(e.target.value)} placeholder="Nome do modelo" autoFocus className="h-8 w-40 text-xs" aria-label="Nome do modelo" />
                <Button size="sm" type="submit" variant="primary">Salvar</Button>
              </form>
            )
          } />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="mr-1 self-center text-xs text-ink-muted">Modelos:</span>
            {PRESETS.map((p) => (
              <button key={p.name} type="button" onClick={() => setBlocks(p.blocks)} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted hover:border-line-strong hover:text-ink">
                {p.name}
              </button>
            ))}
            {templates?.map((t) => (
              <span key={t.id} className="inline-flex items-center rounded-full border border-brass/40 text-xs">
                <button type="button" onClick={() => setBlocks(t.blocks)} className="py-1 pr-1 pl-2.5 text-ink hover:underline">
                  {t.name}
                </button>
                <button type="button" aria-label={`Excluir modelo ${t.name}`} onClick={async () => (await confirm({ title: 'Excluir modelo?', message: `“${t.name}” será removido.`, confirmLabel: 'Excluir', danger: true })) && db.templates.delete(t.id)} className="px-1.5 text-ink-faint hover:text-negative">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          {blocks.length === 0 ? (
            <EmptyState compact title="Sessão vazia" description="Adicione blocos de atividade." />
          ) : (
            <ol className="space-y-2">
              {blocks.map((b, i) => (
                <li key={i} className="grid grid-cols-[1.5rem_minmax(0,11.5rem)_minmax(0,1fr)_5.5rem_auto] items-center gap-2 rounded-md border border-line bg-sunken p-2">
                  <span className="text-center text-xs text-ink-faint tabular-nums">{i + 1}</span>
                  <Select value={b.type} onChange={(e) => update(i, { type: e.target.value as ActivityType, label: ACTIVITY_TYPES[e.target.value as ActivityType].label })} aria-label="Tipo de atividade" className="h-8 text-xs">
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {ACTIVITY_TYPES[t].label}
                      </option>
                    ))}
                  </Select>
                  <Input value={b.label} onChange={(e) => update(i, { label: e.target.value })} aria-label="Descrição" className="h-8 text-xs" />
                  <div className="flex items-center gap-1">
                    <Input type="number" min={1} max={240} value={b.minutes} onChange={(e) => update(i, { minutes: Math.max(1, Math.min(240, Number(e.target.value) || 1)) })} aria-label="Minutos" className="h-8 px-2 text-xs" />
                    <span className="text-xs text-ink-faint">min</span>
                  </div>
                  <div className="flex">
                    <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} aria-label="Subir" disabled={i === 0}>
                      <ArrowUp />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} aria-label="Descer" disabled={i === blocks.length - 1}>
                      <ArrowDown />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setBlocks((bs) => bs.filter((_, j) => j !== i))} aria-label="Remover bloco">
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setBlocks((bs) => [...bs, { type: 'puzzles', minutes: 15, label: 'Puzzles' }])}>
              <Plus /> Adicionar bloco
            </Button>
            <Button variant="primary" className="ml-auto" disabled={!blocks.length} onClick={() => sessionRunner.start(blocks)}>
              <Play /> Iniciar sessão
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card className="self-start">
        <CardHeader icon={<Lightbulb />} title="Sugestões" subtitle={<span className="inline-flex items-center gap-1.5">Com base nos seus resultados <SourceTag source="calc" /></span>} />
        <CardBody className="space-y-3">
          {recs.length === 0 ? (
            <p className="text-sm text-ink-muted">Sem sugestões específicas ainda. Conforme você joga, resolve puzzles e estuda, o Chess Lab identifica onde focar.</p>
          ) : (
            recs.map((r) => (
              <div key={r.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-ink">{r.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{r.reason}</p>
                <Button size="sm" variant="ghost" className="mt-1 -ml-2 text-brass" onClick={() => setBlocks((bs) => [...bs, { type: r.activity, minutes: r.minutes, label: r.title }])}>
                  <Plus /> Adicionar à sessão ({r.minutes} min)
                </Button>
              </div>
            ))
          )}
          <p className="text-[11px] text-ink-faint">As sugestões são opcionais: monte a sessão do jeito que preferir.</p>
        </CardBody>
      </Card>
    </div>
  );
}

function Runner() {
  const run = useStore(sessionStore);
  const [now, setNow] = useState(Date.now());
  const [notes, setNotes] = useState('');
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const block = run.blocks[run.current];
  const elapsed = currentBlockElapsed(run, now);
  const target = block.minutes * 60000;
  const remaining = target - elapsed;
  const allDone = run.blocks.every((b) => b.done);
  const totalElapsed = run.blocks.reduce((s, b, i) => s + (i === run.current ? elapsed : b.actualMs), 0);

  const finish = async () => {
    await sessionRunner.finish(notes);
    toast('Sessão registrada no histórico.', 'positive');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader title={allDone ? 'Todos os blocos concluídos' : `Bloco ${run.current + 1} de ${run.blocks.length}`} subtitle={`Tempo total: ${formatClock(totalElapsed)}`} />
        <CardBody className="space-y-5">
          {!allDone && (
            <div className="text-center">
              <p className="text-sm text-ink-muted">{ACTIVITY_TYPES[block.type].label}</p>
              <p className="font-display mt-1 text-2xl text-ink">{block.label}</p>
              <p className={cn('mt-4 font-mono text-6xl tabular-nums', remaining < 0 ? 'text-warning' : 'text-ink')} aria-live="off">
                {remaining < 0 ? '+' : ''}
                {formatClock(Math.abs(remaining))}
              </p>
              <p className="mt-1 text-xs text-ink-faint">{remaining < 0 ? 'Tempo planejado excedido — tudo bem continuar.' : `de ${block.minutes} min planejados`}</p>
              <ProgressBar value={Math.min(elapsed, target)} max={target} className="mx-auto mt-4 max-w-md" />
              <Link to={ACTIVITY_TYPES[block.type].link} className="mt-4 inline-flex items-center gap-1 text-sm text-brass hover:underline">
                Ir para {ACTIVITY_TYPES[block.type].label} <ArrowRight className="size-3.5" />
              </Link>
              <p className="mt-1 text-[11px] text-ink-faint">O cronômetro continua enquanto você navega pelo Chess Lab.</p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {!allDone &&
              (run.paused ? (
                <Button variant="primary" onClick={sessionRunner.resume}>
                  <Play /> Retomar
                </Button>
              ) : (
                <Button onClick={sessionRunner.pause}>
                  <Pause /> Pausar
                </Button>
              ))}
            {!allDone && (
              <Button variant="primary" onClick={sessionRunner.completeBlock}>
                <Check /> Concluir bloco
              </Button>
            )}
            {!allDone && run.current < run.blocks.length - 1 && (
              <Button variant="ghost" onClick={sessionRunner.skipBlock}>
                <SkipForward /> Pular
              </Button>
            )}
          </div>
          <div className="border-t border-line pt-4">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas da sessão (opcional): o que funcionou, o que revisar…" aria-label="Notas da sessão" className="min-h-20" />
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={async () => {
                  if (await confirm({ title: 'Descartar sessão?', message: 'O tempo desta sessão não será registrado.', confirmLabel: 'Descartar', danger: true })) sessionRunner.cancel();
                }}
              >
                <X /> Descartar
              </Button>
              <Button variant={allDone ? 'primary' : 'secondary'} onClick={finish}>
                <Square /> Encerrar e registrar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card className="self-start">
        <CardHeader title="Roteiro" />
        <CardBody>
          <ol className="space-y-2">
            {run.blocks.map((b, i) => (
              <li key={i} className={cn('flex items-center gap-3 rounded-md border px-3 py-2 text-sm', i === run.current && !allDone ? 'border-brass/60 bg-accent-soft' : 'border-line bg-sunken')}>
                <span className={cn('flex size-5 items-center justify-center rounded-full border text-[10px]', b.done ? 'border-positive bg-positive text-accent-fg' : 'border-line-strong text-ink-faint')}>{b.done ? <Check className="size-3" /> : i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-ink">{b.label}</span>
                <span className="text-xs text-ink-faint tabular-nums">{i === run.current ? formatClock(elapsed) : b.actualMs ? formatClock(b.actualMs) : `${b.minutes} min`}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
