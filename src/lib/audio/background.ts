import { createStore } from '@/lib/store';
import type { AmbientType, Settings } from '@/lib/settings';

/**
 * Música e ambiente só tocam depois de ativados nesta visita (por um controle ou pela opção
 * "Tocar ao abrir o site"). As preferências salvas lembram o que tocar; a sessão diz se já pode.
 */
export interface BackgroundSession {
  musicActive: boolean;
  ambientActive: boolean;
}

export const backgroundSession = createStore<BackgroundSession>({ musicActive: false, ambientActive: false });

type Prefs = Pick<Settings, 'musicEnabled' | 'ambientType' | 'ambientThunder'>;

export interface BackgroundState {
  music: boolean;
  ambient: AmbientType;
  thunder: boolean;
}

/** O que está tocando de fato (e o que os controles mostram). */
export function backgroundState(prefs: Prefs, session: BackgroundSession): BackgroundState {
  return {
    music: prefs.musicEnabled && session.musicActive,
    ambient: session.ambientActive ? prefs.ambientType : 'none',
    thunder: session.ambientActive && prefs.ambientThunder,
  };
}

/**
 * Preferências a gravar quando a pessoa mexe no ambiente. Se ele ainda não estava ativo,
 * a tela mostrava tudo desligado: grava isso junto, para não ressuscitar a escolha antiga.
 */
export function ambientPatch(session: BackgroundSession, change: Partial<Pick<Settings, 'ambientType' | 'ambientThunder'>>): Partial<Pick<Settings, 'ambientType' | 'ambientThunder'>> {
  if (session.ambientActive) return { ...change };
  return { ambientType: 'none', ambientThunder: false, ...change };
}
