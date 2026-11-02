import { createStore } from '@/lib/store';

/**
 * AudioContext único do app. O navegador só libera som depois de uma interação da pessoa,
 * então ele é criado no primeiro clique/tecla (unlockAudio) e não antes.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export const audioUnlock = createStore({ unlocked: false });

/** Chamado a cada interação: cria o contexto na primeira e o retoma se o sistema o suspendeu. */
export function unlockAudio(): void {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  if (!audioUnlock.get().unlocked) audioUnlock.set({ unlocked: true });
}

/** Contexto pronto para tocar (null antes da primeira interação). */
export function getAudioContext(): AudioContext | null {
  return ctx;
}

/** Saída comum de efeitos e ambiente (cada um tem o próprio ganho antes dela). */
export function getAudioOutput(): GainNode | null {
  return master;
}
