import { LESSONS, TRACKS } from '@/data/academyContent';
import type { Lesson } from '@/data/academy/types';
import { db, type LessonProgress } from '@/lib/db/schema';
import { logActivity } from './activity';

export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

export function isCompleted(id: string, progress: Map<string, LessonProgress>) {
  return progress.get(id)?.status === 'completed';
}

export function isUnlocked(lesson: Lesson, progress: Map<string, LessonProgress>) {
  return lesson.requires.every((r) => isCompleted(r, progress));
}

export function missingPrereqs(lesson: Lesson, progress: Map<string, LessonProgress>): Lesson[] {
  return lesson.requires.filter((r) => !isCompleted(r, progress)).map((r) => LESSON_BY_ID.get(r)!).filter(Boolean);
}

/** Próximas aulas disponíveis: em andamento primeiro, depois desbloqueadas na ordem das trilhas. */
export function nextLessons(progress: Map<string, LessonProgress>, limit = 3): Lesson[] {
  const started = LESSONS.filter((l) => progress.get(l.id)?.status === 'started');
  const ordered = TRACKS.flatMap((t) => t.lessonIds.map((id) => LESSON_BY_ID.get(id)!)).filter(Boolean);
  const available = ordered.filter((l) => !progress.get(l.id) && isUnlocked(l, progress));
  return [...started, ...available].slice(0, limit);
}

export function lessonPercent(lesson: Lesson, p: LessonProgress | undefined): number {
  if (!p) return 0;
  if (p.status === 'completed') return 100;
  const total = lesson.sections.length + lesson.exercises.length;
  const done = p.sectionsRead.length + p.exercisesSolved.length;
  return Math.min(99, Math.round((done / total) * 100));
}

async function getOrCreate(lessonId: string): Promise<LessonProgress> {
  const existing = await db.lessonProgress.get(lessonId);
  if (existing) return existing;
  const now = Date.now();
  const row: LessonProgress = { lessonId, status: 'started', sectionsRead: [], exercisesSolved: [], startedAt: now, completedAt: null, updatedAt: now };
  await db.lessonProgress.put(row);
  return row;
}

export async function markSectionRead(lessonId: string, index: number) {
  const p = await getOrCreate(lessonId);
  if (p.sectionsRead.includes(index)) return;
  await db.lessonProgress.update(lessonId, { sectionsRead: [...p.sectionsRead, index], updatedAt: Date.now() });
}

export async function markExerciseSolved(lessonId: string, exerciseId: string) {
  const p = await getOrCreate(lessonId);
  if (p.exercisesSolved.includes(exerciseId)) return;
  await db.lessonProgress.update(lessonId, { exercisesSolved: [...p.exercisesSolved, exerciseId], updatedAt: Date.now() });
}

export async function startLesson(lessonId: string) {
  await getOrCreate(lessonId);
}

export async function completeLesson(lessonId: string) {
  await getOrCreate(lessonId);
  const now = Date.now();
  await db.lessonProgress.update(lessonId, { status: 'completed', completedAt: now, updatedAt: now });
  const l = LESSON_BY_ID.get(lessonId);
  await logActivity({ kind: 'lesson', title: `Aula concluída: ${l?.title ?? lessonId}`, link: `/academia/${lessonId}` });
}

export async function reopenLesson(lessonId: string) {
  await db.lessonProgress.update(lessonId, { status: 'started', completedAt: null, updatedAt: Date.now() });
}

export async function logLessonTime(lessonId: string, ms: number) {
  if (ms < 30_000) return;
  const l = LESSON_BY_ID.get(lessonId);
  await logActivity({ kind: 'lesson', title: `Estudo: ${l?.title ?? lessonId}`, detail: 'Tempo na aula', durationMs: ms, link: `/academia/${lessonId}` });
}
