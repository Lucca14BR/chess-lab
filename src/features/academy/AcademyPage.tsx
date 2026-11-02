import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Lock, Check, Clock, GraduationCap, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db/schema';
import { TRACKS } from '@/data/academyContent';
import type { AcademyCategory, Level } from '@/data/academy/types';
import { LESSON_BY_ID, isUnlocked, lessonPercent, missingPrereqs, nextLessons } from '@/lib/services/academy';
import { Page, PageHeader } from '@/components/ui/Page';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Form';
import { EmptyState, ProgressBar, Ring } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export const CATEGORY_LABEL: Record<AcademyCategory, string> = {
  fundamentos: 'Fundamentos',
  aberturas: 'Aberturas',
  tatica: 'Tática',
  estrategia: 'Estratégia',
  'meio-jogo': 'Meio-jogo',
  finais: 'Finais',
  planejamento: 'Planejamento',
  analise: 'Análise de partidas',
};

export const LEVEL_LABEL: Record<Level, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

export default function AcademyPage() {
  const rows = useLiveQuery(() => db.lessonProgress.toArray(), []);
  const progress = new Map((rows ?? []).map((r) => [r.lessonId, r]));
  const [level, setLevel] = useState<Level | 'todos'>('todos');
  const total = LESSON_BY_ID.size;
  const done = (rows ?? []).filter((r) => r.status === 'completed').length;
  const next = nextLessons(progress, 1)[0];

  return (
    <Page>
      <PageHeader eyebrow="Workspace" title="Academia" description="Trilhas de aprendizado com aulas, exemplos em tabuleiro e exercícios validados. Algumas aulas exigem pré-requisitos para manter uma progressão sólida." />
      {TRACKS.length > 0 && (
      <div className="mb-6 grid gap-5 md:grid-cols-[auto_1fr]">
        <Card className="flex items-center gap-5 p-5">
          <Ring value={total ? (done / total) * 100 : 0} size={92}>
            <span className="font-display text-xl text-ink tabular-nums">{total ? Math.round((done / total) * 100) : 0}%</span>
          </Ring>
          <div>
            <p className="font-display text-xl text-ink">
              {done} de {total} aulas
            </p>
            <p className="text-sm text-ink-muted">concluídas</p>
          </div>
        </Card>
        {next && (
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-brass uppercase">{progress.get(next.id) ? 'Continue de onde parou' : 'Próxima aula sugerida'}</p>
              <p className="font-display mt-1 text-2xl text-ink">{next.title}</p>
              <p className="text-sm text-ink-muted">{next.description}</p>
            </div>
            <ButtonLink to={`/academia/${next.id}`} variant="primary">
                {progress.get(next.id) ? 'Continuar' : 'Começar'} <ArrowRight />
              </ButtonLink>
          </Card>
        )}
      </div>
      )}
      {TRACKS.length > 0 && (
      <div className="mb-4 flex justify-end">
        <Segmented<Level | 'todos'>
          size="sm"
          value={level}
          onChange={setLevel}
          ariaLabel="Filtrar por nível"
          options={[
            { value: 'todos', label: 'Todos os níveis' },
            { value: 'iniciante', label: 'Iniciante' },
            { value: 'intermediario', label: 'Intermediário' },
            { value: 'avancado', label: 'Avançado' },
          ]}
        />
      </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TRACKS.map((t) => {
          const lessons = t.lessonIds.map((id) => LESSON_BY_ID.get(id)!).filter(Boolean);
          const tDone = lessons.filter((l) => progress.get(l.id)?.status === 'completed').length;
          return (
            <Card key={t.id} className="flex flex-col">
              <div className="border-b border-line px-5 py-4">
                <p className="text-[10px] tracking-[0.18em] text-brass uppercase">{CATEGORY_LABEL[t.category]}</p>
                <h2 className="font-display mt-1 text-xl leading-tight text-ink">{t.title}</h2>
                <p className="mt-1 text-xs text-ink-muted">{t.description}</p>
                <ProgressBar value={tDone} max={lessons.length} className="mt-3" />
                <p className="mt-1 text-[11px] text-ink-faint tabular-nums">
                  {tDone}/{lessons.length} concluídas
                </p>
              </div>
              <CardBody className="flex-1 space-y-1 px-3 py-3">
                {lessons
                  .filter((l) => level === 'todos' || l.level === level)
                  .map((l, i) => {
                    const p = progress.get(l.id);
                    const unlocked = isUnlocked(l, progress);
                    const missing = missingPrereqs(l, progress);
                    const percent = lessonPercent(l, p);
                    return (
                      <Link key={l.id} to={`/academia/${l.id}`} className={cn('flex items-start gap-3 rounded-md px-2 py-2 hover:bg-hover', !unlocked && 'opacity-60')} title={!unlocked ? `Requer: ${missing.map((m) => m.title).join(', ')}` : undefined}>
                        <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px]', p?.status === 'completed' ? 'border-positive bg-positive text-accent-fg' : p ? 'border-brass text-brass' : 'border-line-strong text-ink-faint')}>
                          {p?.status === 'completed' ? <Check className="size-3.5" /> : !unlocked ? <Lock className="size-3" /> : i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug text-ink">{l.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                            <Badge>{LEVEL_LABEL[l.level]}</Badge>
                            <span className="flex items-center gap-0.5">
                              <Clock className="size-3" /> {l.minutes} min
                            </span>
                            {p && p.status !== 'completed' && <span className="text-brass">{percent}%</span>}
                          </span>
                          {!unlocked && <span className="mt-0.5 block text-[11px] text-ink-faint">Requer: {missing.map((m) => m.title).join(', ')}</span>}
                        </span>
                      </Link>
                    );
                  })}
                {lessons.every((l) => level !== 'todos' && l.level !== level) && <p className="px-2 py-3 text-xs text-ink-faint">Nenhuma aula deste nível nesta trilha.</p>}
              </CardBody>
            </Card>
          );
        })}
      </div>
      {TRACKS.length === 0 && (
        <Card>
          <EmptyState icon={<GraduationCap />} title="Conteúdo das aulas em preparação" description="As trilhas e aulas da Academia ainda estão sendo escritas e validadas. Enquanto isso, pratique na Sala de Desafios ou estude a Biblioteca de Aberturas." action={<><ButtonLink to="/puzzles" variant="primary">Resolver puzzles</ButtonLink><ButtonLink to="/aberturas">Ver aberturas</ButtonLink></>} />
        </Card>
      )}
    </Page>
  );
}
