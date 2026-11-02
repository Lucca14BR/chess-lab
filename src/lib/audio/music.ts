import { createStore } from '@/lib/store';
import { nextTrackId, trackAfterRemoval } from './playlist';

/**
 * Player de música único (um HTMLAudioElement fora do React): continua tocando ao trocar de página.
 * O AudioHost diz se deve tocar, o volume, o modo aleatório e a lista de faixas.
 *
 * O Safari só deixa tocar dentro do gesto da pessoa: os botões chamam `playNow`/`skipTrack`
 * na hora do clique (sem await antes), e toda interação tenta de novo se o navegador recusou.
 */

export interface PlayerTrack {
  id: string;
  name: string;
  author?: string;
  src: { kind: 'url'; url: string } | { kind: 'blob'; blob: Blob };
}

export const musicStore = createStore<{ currentId: string | null; currentName: string | null; error: string | null; blocked: boolean }>({
  currentId: null,
  currentName: null,
  error: null,
  blocked: false, // o navegador recusou tocar: a tela mostra "tocar" em vez de "pausar"
});

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
    el.addEventListener('ended', () => switchTo(nextTrackId(ids(), musicStore.get().currentId, shuffle)));
    el.addEventListener('playing', () => {
      failures = 0;
      if (musicStore.get().error || musicStore.get().blocked) musicStore.set({ error: null, blocked: false });
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

/** Solta o arquivo carregado (e a URL do Blob, se for uma música da pessoa). */
function release() {
  if (el) {
    el.pause();
    el.removeAttribute('src');
    el.load();
  }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  loadedId = null;
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

/** Chama play() já (síncrono): dentro de um gesto, o navegador aceita. */
function startPlayback() {
  const a = audio();
  if (!find(musicStore.get().currentId)) setCurrent(nextTrackId(ids(), null, shuffle));
  loadCurrent();
  if (!loadedId) return;
  if (!a.paused) {
    fade(volume, 300);
    return;
  }
  if (fadeTimer !== null) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
  a.volume = 0;
  a.play()
    .then(() => fade(volume, 700))
    .catch((e: Error) => {
      // recusado (fora de um gesto): a tela volta a mostrar "tocar"; a próxima interação tenta de novo
      if (e?.name === 'NotAllowedError' && want) musicStore.set({ blocked: true });
    });
}

function stopPlayback() {
  if (musicStore.get().blocked) musicStore.set({ blocked: false });
  if (el && !el.paused) fade(0, 400, () => el?.pause());
}

function onError() {
  const t = find(loadedId);
  failures++;
  musicStore.set({ error: t ? `Não foi possível tocar “${t.name}”.` : 'Não foi possível tocar a música.' });
  loadedId = null;
  // pula para a próxima, mas não fica em ciclo se nenhuma funcionar
  if (want && failures < tracks.length) switchTo(nextTrackId(ids(), musicStore.get().currentId, shuffle), true);
}

/** Troca de faixa. Com `now`, troca na hora (para o play continuar no gesto); senão, com fade. */
function switchTo(id: string | null, now = false) {
  setCurrent(id);
  if (!want) return;
  if (now || !el || el.paused) {
    el?.pause();
    startPlayback();
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
  if (changed) {
    if (want) startPlayback();
    else stopPlayback();
  } else if (want && !loadedId && failures < tracks.length) startPlayback(); // ligada antes de a lista chegar
  else if (want && el && !el.paused && fadeTimer === null) el.volume = volume;
}

/** Botão "tocar": começa no próprio clique, antes de qualquer gravação. */
export function playNow() {
  want = true;
  if (musicStore.get().blocked) musicStore.set({ blocked: false });
  startPlayback();
}

/** Botão "próxima faixa": troca na hora (sem fade, para o play ficar dentro do clique). */
export function skipTrack() {
  switchTo(nextTrackId(ids(), musicStore.get().currentId, shuffle), true);
}

/** Escolhe uma faixa da lista; toca na hora se a música estiver ligada. */
export function selectMusicTrack(id: string) {
  if (id !== musicStore.get().currentId) switchTo(id, true);
  else if (want) startPlayback();
}

/** A cada interação: se devia estar tocando e o navegador recusou, tenta de novo (dentro do gesto). */
export function resumeIfBlocked() {
  if (want && el?.paused && fadeTimer === null && loadedId) startPlayback();
}

/** Depois da primeira interação (quando o navegador passa a permitir som). */
export function retryMusic() {
  if (want) startPlayback();
}

/** Lista atual (incluídas + da pessoa). Se a faixa atual sumiu, passa para a seguinte e solta o arquivo. */
export function setMusicTracks(list: PlayerTrack[]) {
  const before = ids();
  tracks = list;
  if (loadedId && !find(loadedId)) release(); // removida (ou "Apagar dados locais"), tocando ou não
  const cur = musicStore.get().currentId;
  const next = cur === null ? null : trackAfterRemoval(before, ids(), cur);
  if (cur !== null && next !== cur) switchTo(next, true);
  else {
    if (cur !== null) musicStore.set({ currentName: find(cur)?.name ?? null });
    if (want && !loadedId && failures < tracks.length) startPlayback(); // "tocar" chegou antes das faixas
  }
}
