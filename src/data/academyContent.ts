// Carrega o conteúdo da Academia somente se ele existir (src/data/academy/index.ts).
// Enquanto o conteúdo não estiver disponível, o app funciona com trilhas vazias.
import type { Lesson, Track } from './academy/types';

const mods = import.meta.glob<{ LESSONS?: Lesson[]; TRACKS?: Track[] }>('./academy/index.ts', { eager: true });
const mod = Object.values(mods)[0];

export const LESSONS: Lesson[] = mod?.LESSONS ?? [];
export const TRACKS: Track[] = mod?.TRACKS ?? [];
export const ACADEMY_READY = LESSONS.length > 0;
