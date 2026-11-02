import type { SfxSet } from '@/lib/settings';
import { audioRunning, getAudioContext, getAudioOutput } from './context';

/** Efeitos sonoros (pacotes da Lichess, por Enigmahack, AGPLv3+), tocados por Web Audio. */

export const SFX_NAMES = ['Move', 'Capture', 'Check', 'Victory', 'Defeat', 'Draw', 'GenericNotify', 'LowTime'] as const;
export type SfxName = (typeof SFX_NAMES)[number];

export const SFX_SETS: Array<{ id: SfxSet; label: string }> = [
  { id: 'sfx', label: 'Padrão' },
  { id: 'piano', label: 'Piano' },
  { id: 'nes', label: 'NES (8 bits)' },
  { id: 'futuristic', label: 'Futurista' },
];

export const SFX_LABELS: Record<SfxName, string> = {
  Move: 'Lance',
  Capture: 'Captura',
  Check: 'Xeque',
  Victory: 'Vitória',
  Defeat: 'Derrota',
  Draw: 'Empate',
  GenericNotify: 'Acerto',
  LowTime: 'Erro',
};

interface SfxConfig {
  enabled: boolean;
  set: SfxSet;
  volume: number; // já multiplicado pelo volume geral
  onNavigate: boolean;
}

let config: SfxConfig = { enabled: true, set: 'sfx', volume: 0.56, onNavigate: true };
let loadedSet: SfxSet | null = null;
const buffers = new Map<SfxName, Promise<AudioBuffer | null>>();

const url = (set: SfxSet, name: SfxName) => `${import.meta.env.BASE_URL}sounds/${set}/${name}.mp3`;

function load(name: SfxName): Promise<AudioBuffer | null> | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (loadedSet !== config.set) {
    // trocou de pacote: descarta o anterior e recarrega
    buffers.clear();
    loadedSet = config.set;
  }
  let p = buffers.get(name);
  if (!p) {
    p = fetch(url(config.set, name))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => {
        buffers.delete(name); // tenta de novo na próxima vez
        return null;
      });
    buffers.set(name, p);
  }
  return p;
}

/** Carrega os 8 sons do pacote ativo (depois da primeira interação). */
export function preloadSfx(): void {
  for (const n of SFX_NAMES) void load(n);
}

export function configureSfx(next: SfxConfig): void {
  const changedSet = next.set !== config.set;
  config = next;
  if (changedSet && getAudioContext()) preloadSfx();
}

/** Quando tocou o último som de desfecho (vitória, derrota, empate, acerto). */
let finaleAt = -Infinity;
const FINALE_WINDOW_MS = 300;

/**
 * Toca um efeito. Cada chamada cria a própria fonte, então sons rápidos se sobrepõem sem cortar.
 * `finale`: som de desfecho; ele substitui o som do lance que terminou a partida ou o problema.
 */
export function playSfx(name: SfxName, opts: { preview?: boolean; finale?: boolean } = {}): void {
  if (opts.finale) finaleAt = performance.now();
  if (!config.enabled && !opts.preview) return;
  const ctx = getAudioContext();
  const out = getAudioOutput();
  const pending = load(name);
  if (!ctx || !out || !pending || config.volume <= 0) return;
  const requestedAt = performance.now();
  void pending.then((buffer) => {
    // ainda carregando há muito tempo: melhor não tocar atrasado; contexto parado: não acumular
    if (!buffer || performance.now() - requestedAt > 1500 || !audioRunning()) return;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.value = config.volume;
    src.connect(gain).connect(out);
    src.start();
  });
}

/**
 * Som de lance do tabuleiro. Espera a rodada atual terminar: se o mesmo lance trouxe um som
 * de desfecho (tocado antes, no clique, ou depois, no efeito da página), o lance fica em silêncio.
 */
export function playMoveSfx(name: SfxName): void {
  window.setTimeout(() => {
    if (performance.now() - finaleAt < FINALE_WINDOW_MS) return;
    playSfx(name);
  }, 0);
}

/** Efeitos ligados? (e, navegando, se a opção de tocar ao navegar está ligada) */
export function sfxWanted(navigation: boolean): boolean {
  return config.enabled && (!navigation || config.onNavigate);
}
