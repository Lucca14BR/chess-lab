import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ArrowRight, Check, Clock, Lock, Puzzle, BookmarkPlus, RotateCcw, ListChecks } from 'lucide-react';
import { db } from '@/lib/db/schema';
import { TRACKS } from '@/data/academyContent';
import { LESSON_BY_ID, completeLesson, isUnlocked, lessonPercent, logLessonTime, markExerciseSolved, markSectionRead, missingPrereqs, reopenLesson, startLesson } from '@/lib/services/academy';
import { CATEGORY_INFO } from '@/lib/puzzles';
import { Page } from '@/components/ui/Page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, ProgressBar } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Dialog';
import { ExampleBoard } from '@/components/board/ExampleBoard';
import { ExerciseBoard } from '@/components/board/ExerciseBoard';
import { CATEGORY_LABEL, LEVEL_LABEL } from './AcademyPage';
import { cn, uid } from '@/lib/utils';
import { fenAfter } from '@/lib/chess/board';

export default function LessonPage() {
  const { lessonId = '' } = useParams();
  const lesson = LESSON_BY_ID.get(lessonId);
  const rows = useLiveQuery(() => db.lessonProgress.toArray(), []);
  const progress = new Map((rows ?? []).map((r) => [r.lessonId, r]));
  const p = progress.get(lessonId);
  const [override, setOverride] = useState(false);
  const enteredAt = useRef(Date.now());
  const visibleMs = useRef(0);

  // Tempo de estudo: conta apenas enquanto a aba está visível.
  useEffect(() => {
    enteredAt.current = Date.now();
    visibleMs.current = 0;
    const onVis = () => {
      if (document.hidden) visibleMs.current += Date.now() - enteredAt.current;
      else enteredAt.current = Date.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (!document.hidden) visibleMs.current += Date.now() - enteredAt.current;
      void logLessonTime(lessonId, visibleMs.current);
    };
  }, [lessonId]);

  if (!lesson) {
    return (
      <Page>
        <EmptyState title="Aula não encontrada" action={<ButtonLink to="/academia">Voltar à Academia</ButtonLink>} />
      </Page>
    );
  }

  const track = TRACKS.find((t) => t.id === lesson.trackId);
  const idx = track ? track.lessonIds.indexOf(lesson.id) : -1;
  const prev = track && idx > 0 ? LESSON_BY_ID.get(track.lessonIds[idx - 1]) : undefined;
  const next = track && idx >= 0 && idx < track.lessonIds.length - 1 ? LESSON_BY_ID.get(track.lessonIds[idx + 1]) : undefined;
  const unlocked = rows === undefined || isUnlocked(lesson, progress);
  const missing = missingPrereqs(lesson, progress);
  const solved = new Set(p?.exercisesSolved ?? []);
  const allSolved = lesson.exercises.every((e) => solved.has(e.id));
  const percent = lessonPercent(lesson, p);
  const completed = p?.status === 'completed';

  const savePosition = async (fen: string, name: string) => {
    await db.positions.add({ id: uid(), fen, name, notes: `Da aula “${lesson.title}”`, tags: [CATEGORY_LABEL[lesson.category]], favorite: false, source: 'lesson', createdAt: Date.now() });
    toast('Posição salva no Caderno.', 'positive');
  };

  return (
    <Page className="max-w-[1100px]">
      <Link to="/academia" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Academia {track && `· ${track.title}`}
      </Link>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="accent">{CATEGORY_LABEL[lesson.category]}</Badge>
          <Badge>{LEVEL_LABEL[lesson.level]}</Badge>
          <span className="flex items-center gap-1 text-ink-muted">
            <Clock className="size-3.5" /> {lesson.minutes} min
          </span>
          {completed && (
            <Badge tone="positive">
              <Check /> Concluída
            </Badge>
          )}
        </div>
        <h1 className="font-display mt-2 text-4xl leading-tight text-ink">{lesson.title}</h1>
        <p className="mt-2 max-w-3xl text-ink-muted">{lesson.description}</p>
        <div className="mt-4 max-w-md">
          <ProgressBar value={percent} />
          <p className="mt-1 text-xs text-ink-faint tabular-nums">{percent}% · {p?.sectionsRead.length ?? 0}/{lesson.sections.length} seções lidas · {solved.size}/{lesson.exercises.length} exercícios</p>
        </div>
      </header>

      {!unlocked && !override ? (
        <Card>
          <CardBody className="space-y-4">
            <Alert tone="warning" title="Aula bloqueada pelos pré-requisitos">
              Conclua antes: {missing.map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ', '}
                  <Link to={`/academia/${m.id}`} className="text-brass hover:underline">
                    {m.title}
                  </Link>
                </span>
              ))}
              .
            </Alert>
            <p className="text-sm text-ink-muted">Os pré-requisitos ajudam você a construir o conhecimento em ordem, mas a aula fica aberta mesmo assim.</p>
            <Button
              onClick={() => {
                setOverride(true);
                void startLesson(lesson.id);
              }}
            >
              <Lock /> Abrir mesmo assim
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {lesson.sections.map((s, i) => {
            const read = p?.sectionsRead.includes(i);
            return (
              <Card key={i}>
                <CardHeader title={s.heading} action={read ? <Badge tone="positive"><Check /> Lida</Badge> : <Button size="sm" variant="ghost" onClick={() => void markSectionRead(lesson.id, i)}><Check /> Marcar como lida</Button>} />
                <CardBody className={cn('grid gap-6', s.example && 'md:grid-cols-[minmax(0,1fr)_340px]')}>
                  <div className="prose-lab text-[15px] text-ink">
                    {s.paragraphs.map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                  {s.example && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-ink">{s.example.title}</p>
                      <ExampleBoard fen={s.example.fen} moves={s.example.moves} orientation={s.example.orientation} arrows={s.example.arrows} />
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{s.example.caption}</p>
                      <div className="mt-2 flex gap-2">
                        <ButtonLink to={`/tabuleiro?fen=${encodeURIComponent(s.example.fen)}`} size="sm" variant="ghost">
                            Abrir no Tabuleiro
                          </ButtonLink>
                        <Button size="sm" variant="ghost" onClick={() => void savePosition(s.example!.moves?.length ? fenAfter(s.example!.moves, s.example!.fen) : s.example!.fen, s.example!.title)}>
                          <BookmarkPlus /> Salvar posição
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}

          <Card>
            <CardHeader icon={<ListChecks />} title="Pontos-chave" />
            <CardBody>
              <ul className="space-y-2">
                {lesson.keyPoints.map((k, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brass" />
                    {k}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<Puzzle />} title="Exercícios" subtitle={`${solved.size} de ${lesson.exercises.length} resolvidos`} />
            <CardBody className="space-y-8">
              {lesson.exercises.map((ex, i) => (
                <div key={ex.id} className={cn(i > 0 && 'border-t border-line pt-6')}>
                  <p className="mb-3 text-sm font-medium text-ink">
                    {i + 1}. {ex.prompt}
                    {solved.has(ex.id) && <Check className="ml-1.5 inline size-4 text-positive" />}
                  </p>
                  <ExerciseBoard fen={ex.fen} solution={ex.solution} checkmate={ex.checkmate} explanation={ex.explanation} solved={solved.has(ex.id)} onSolved={() => void markExerciseSolved(lesson.id, ex.id)} />
                </div>
              ))}
              {lesson.practiceTheme && (
                <div className="rounded-md border border-line bg-sunken p-4 text-sm">
                  <p className="text-ink">Pratique mais: {CATEGORY_INFO[lesson.practiceTheme].label}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">Puzzles reais deste tema na Sala de Desafios.</p>
                  <Link to={`/puzzles?tema=${lesson.practiceTheme}`} className="mt-2 inline-flex items-center gap-1 text-xs text-brass hover:underline">
                    Abrir puzzles <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-4">
            {completed ? (
              <>
                <p className="flex items-center gap-2 text-sm text-positive">
                  <Check className="size-4" /> Aula concluída.
                </p>
                <Button variant="ghost" onClick={() => void reopenLesson(lesson.id)}>
                  <RotateCcw /> Marcar como não concluída
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-muted">{allSolved ? 'Todos os exercícios resolvidos. Você pode concluir a aula.' : 'Resolva os exercícios para concluir a aula.'}</p>
                <Button variant="primary" disabled={!allSolved} onClick={() => void completeLesson(lesson.id).then(() => toast('Aula concluída!', 'positive'))}>
                  <Check /> Concluir aula
                </Button>
              </>
            )}
          </div>

          <nav className="flex justify-between gap-3" aria-label="Navegação entre aulas">
            {prev ? (
              <Link to={`/academia/${prev.id}`} className="text-sm text-ink-muted hover:text-ink">
                <ArrowLeft className="mr-1 inline size-4" />
                {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/academia/${next.id}`} className="text-right text-sm text-ink-muted hover:text-ink">
                {next.title}
                <ArrowRight className="ml-1 inline size-4" />
              </Link>
            )}
          </nav>
        </div>
      )}
    </Page>
  );
}
