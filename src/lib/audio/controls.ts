import { setSetting, setSettings, useSettings, type AmbientType } from '@/lib/settings';
import { useStore } from '@/lib/store';
import { ambientPatch, backgroundSession, backgroundState, type BackgroundState } from './background';
import { selectMusicTrack } from './music';

/** Ações dos controles de som (barra do topo e Configurações › Som). */

export const AMBIENT_OPTIONS: Array<{ value: AmbientType; label: string }> = [
  { value: 'none', label: 'Nenhum' },
  { value: 'calm', label: 'Chuva calma' },
  { value: 'heavy', label: 'Chuva pesada' },
];

/** O que está tocando agora (música e ambiente), já considerando esta visita. */
export function useBackground(): BackgroundState {
  const s = useSettings();
  const session = useStore(backgroundSession);
  return backgroundState(s, session);
}

export async function setMusicOn(on: boolean) {
  await setSetting('musicEnabled', on);
  backgroundSession.set({ musicActive: true });
}

/** Toca uma faixa da lista (liga a música, se estiver desligada). */
export async function playTrack(id: string) {
  selectMusicTrack(id);
  await setMusicOn(true);
}

/** Muda o ambiente; grava antes de ativar, para não tocar por um instante a escolha antiga. */
export async function setAmbient(change: { ambientType?: AmbientType; ambientThunder?: boolean }) {
  await setSettings(ambientPatch(backgroundSession.get(), change));
  backgroundSession.set({ ambientActive: true });
}
