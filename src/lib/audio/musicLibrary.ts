import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MusicTrackRow } from '@/lib/db/schema';
import { uid } from '@/lib/utils';

/** Músicas da pessoa: arquivos guardados só neste navegador (IndexedDB), fora do backup. */

export const MAX_MUSIC_BYTES = 50 * 1024 * 1024;

const AUDIO_EXT = /\.(mp3|ogg|oga|opus|wav|m4a|aac|flac|webm|weba)$/i;

/** Mensagem de erro para um arquivo recusado (null = pode guardar). */
export function checkMusicFile(f: { name: string; type: string; size: number }): string | null {
  const isAudio = f.type ? f.type.startsWith('audio/') : AUDIO_EXT.test(f.name);
  if (!isAudio) return `“${f.name}” não é um arquivo de áudio.`;
  if (f.size > MAX_MUSIC_BYTES) return `“${f.name}” passa de 50 MB, o limite por música.`;
  return null;
}

/** Nome exibido: o nome do arquivo sem a extensão. */
export function trackName(fileName: string): string {
  const base = fileName.replace(/\.[^./\\]+$/, '');
  return (base || fileName).replace(/_/g, ' ').trim() || fileName;
}

function isQuotaError(e: unknown): boolean {
  let cur = e as { name?: string; inner?: unknown } | null | undefined;
  for (let i = 0; cur && i < 4; i++, cur = cur.inner as typeof cur) {
    if (cur.name === 'QuotaExceededError') return true;
  }
  return false;
}

/** Mensagem clara quando o navegador recusa guardar a música. */
export function musicSaveError(e: unknown): string {
  if (isQuotaError(e)) return 'O navegador não tem mais espaço para guardar músicas. Remova algumas faixas suas ou libere espaço e tente de novo.';
  return 'Não foi possível guardar a música neste navegador.';
}

/** Guarda as músicas válidas; devolve quantas entraram e os motivos das recusadas. */
export async function addMusicFiles(files: File[], now: () => number = Date.now): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = [];
  let added = 0;
  for (const f of files) {
    const problem = checkMusicFile(f);
    if (problem) {
      errors.push(problem);
      continue;
    }
    const row: MusicTrackRow = { id: uid(), name: trackName(f.name), type: f.type || 'audio/*', size: f.size, addedAt: now(), blob: f };
    try {
      await db.musicTracks.add(row);
      added++;
    } catch (e) {
      errors.push(musicSaveError(e));
      if (isQuotaError(e)) break; // sem espaço: as próximas também falhariam
    }
  }
  return { added, errors };
}

export async function removeMusicTrack(id: string): Promise<void> {
  await db.musicTracks.delete(id);
}

/** Músicas da pessoa, na ordem em que foram adicionadas (undefined enquanto carrega). */
export function useUserTracks(): MusicTrackRow[] | undefined {
  return useLiveQuery(() => db.musicTracks.orderBy('addedAt').toArray(), []);
}
