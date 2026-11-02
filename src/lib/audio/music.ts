import { createStore } from '@/lib/store';
import { nextTrackId, trackAfterRemoval } from './playlist';

/**
 * Player de música único (um HTMLAudioElement fora do React): continua tocando ao trocar de página.
 * O AudioHost diz se deve tocar, o volume, o modo aleatório e a lista de faixas.
 */

export interface PlayerTrack {
  id: string;
  name: string;
  author?: string;
  src: { kind: 'url'; url: string } | { kind: 'blob'; blob: Blob };
}

export const musicStore = createStore<{ currentId: string | null; currentName: string | null; error: string | null }>({ currentId: null, currentName: null, error: null });

let tracks: PlayerTrack[] = [];
let want = false;
let shuffle = false;
let volume = 0.32;
let el: HTMLAudioElement | null = null;
let loadedId: string | null = null;
let objectUrl: string | null = null;
let fadeTimer: number | null = null;
let failures = 0;

const ids = () => tracks.map((t) => t.id);
const find = (id: string | null) => tracks.find((t) => t.id === id) ?? null;

function audio(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = 'auto';
    el.addEventListener('ended', () => nextMusicTrack());
    el.addEventListener('playing', () => {
      failures = 0;
      if (musicStore.get().error) musicStore.set({ error: null });
    });
    el.addEventListener('error', onError);
  }
  return el;
}

function setCurrent(id: string | null) {
  musicStore.set({ currentId: id, currentName: find(id)?.name ?? null });
}

/** Volume em rampa curta (o elemento de áudio não tem automação como o Web Audio). */
function fade(to: number, ms: number, then?: () => void) {
  const a = audio();
  if (fadeTimer !== null) clearInterval(fadeTimer);
  const from = a.volume;
  const steps = Math.max(1, Math.round(ms / 30));
  let i = 0;
  fadeTimer = window.setInterval(() => {
    i++;
    a.volume = Math.min(1, Math.max(0, from + ((to - from) * i) / steps));
    if (i >= steps) {
      clearInterval(fadeTimer!);
      fadeTimer = null;
      then?.();
    }
  }, 30);
}

/** Aponta o elemento para a faixa atual (URL do arquivo incluído ou do Blob guardado). */
function loadCurrent() {
  const t = find(musicStore.get().currentId);
  if (!t || loadedId === t.id) return;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = t.src.kind === 'blob' ? URL.createObjectURL(t.src.blob) : null;
  audio().src = objectUrl ?? (t.src as { url: string }).url;
  loadedId = t.id;
}

function startPlayback() {
  const a = audio();
  loadCurrent();
  if (!loadedId) return;
  if (a.paused) {
    a.volume = 0;
    // antes da primeira interação o navegador recusa: o AudioHost tenta de novo depois
    a.play().then(() => fade(volume, 700)).catch(() => {});
  } else fade(volume, 300);
}

/** Aplica o estado desejado (tocar ou pausar com fade). */
function apply() {
  if (want) {
    if (!find(musicStore.get().currentId)) setCurrent(nextTrackId(ids(), null, shuffle));
    startPlayback();
  } else if (el && !el.paused) fade(0, 400, () => el?.pause());
}

function onError() {
  const t = find(loadedId);
  failures++;
  musicStore.set({ error: t ? `Não foi possível tocar “${t.name}”.` : 'Não foi possível tocar a música.' });
  loadedId = null;
  // pula para a próxima, mas não fica em ciclo se nenhuma funcionar
  if (want && failures < tracks.length) nextMusicTrack();
}

/** Troca de faixa: se estiver tocando, sai em fade e entra a nova. */
function switchTo(id: string | null) {
  setCurrent(id);
  if (!want || !el || el.paused) {
    if (want) startPlayback();
    return;
  }
  fade(0, 250, () => {
    el?.pause();
    startPlayback();
  });
}

export function updateMusic(cfg: { on: boolean; volume: number; shuffle: boolean }) {
  volume = cfg.volume;
  shuffle = cfg.shuffle;
  const changed = want !== cfg.on;
  want = cfg.on;
  if (changed) apply();
  else if (want && el && !el.paused && fadeTimer === null) el.volume = volume;
}

/** Lista atual (incluídas + da pessoa). Se a faixa atual sumiu, passa para a seguinte. */
export function setMusicTracks(list: PlayerTrack[]) {
  const before = ids();
  tracks = list;
  const cur = musicStore.get().currentId;
  if (cur === null) return;
  const next = trackAfterRemoval(before, ids(), cur);
  if (next !== cur) {
    if (loadedId === cur && el) {
      el.pause();
      loadedId = null;
    }
    switchTo(next);
  } else musicStore.set({ currentName: find(cur)?.name ?? null });
}

export function nextMusicTrack() {
  switchTo(nextTrackId(ids(), musicStore.get().currentId, shuffle));
}

/** Escolhe uma faixa da lista (toca se a música estiver ligada). */
export function selectMusicTrack(id: string) {
  if (id !== musicStore.get().currentId) switchTo(id);
  else if (want) startPlayback();
}

/** Nova tentativa depois da primeira interação (quando o navegador passa a permitir som). */
export function retryMusic() {
  if (want) apply();
}
