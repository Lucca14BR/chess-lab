import type { AmbientType } from '@/lib/settings';
import { getAudioContext, getAudioOutput } from './context';
import { thunderDelayMs, thunderEnvelope, thunderStrike } from './thunder';

/**
 * Sons ambiente gerados no navegador (Web Audio, sem arquivos, funciona offline).
 * - Chuva: ruído branco filtrado (o "chiado"), uma camada grave opcional e gotas curtas sorteadas.
 * - Trovão: ruído marrom (grave) num passa-baixa, com curva de volume de estrondo + rolagens.
 * Tudo entra e sai com rampas de volume, para não estalar.
 */

export interface AmbientConfig {
  type: AmbientType;
  thunder: boolean;
  volume: number; // já multiplicado pelo volume geral
}

const FADE_S = 1.5;

interface RainPreset {
  hiss: number; // volume do chiado
  highpassHz: number;
  lowpassHz: number;
  body: number; // camada grave (chuva forte batendo no chão)
  bodyHz: number;
  dropsPerSec: number;
  drop: number; // volume de cada gota
  dropHz: [number, number];
  swellHz: number; // oscilação lenta da intensidade
  swellDepth: number;
}

const RAIN: Record<Exclude<AmbientType, 'none'>, RainPreset> = {
  calm: { hiss: 0.16, highpassHz: 600, lowpassHz: 5200, body: 0.05, bodyHz: 280, dropsPerSec: 9, drop: 0.09, dropHz: [2500, 6500], swellHz: 0.06, swellDepth: 0.3 },
  heavy: { hiss: 0.36, highpassHz: 250, lowpassHz: 9000, body: 0.3, bodyHz: 450, dropsPerSec: 40, drop: 0.07, dropHz: [1200, 5000], swellHz: 0.1, swellDepth: 0.25 },
};

/* ---------------- ruído ---------------- */

let noise: { ctx: AudioContext; white: AudioBuffer; brown: AudioBuffer } | null = null;

/**
 * Gera `seconds` de ruído que pode ficar em loop sem emenda: o fim é mesclado
 * com o começo (crossfade), então não há salto de valor no ponto do loop.
 */
function loopableNoise(ctx: AudioContext, seconds: number, brown: boolean): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(seconds * rate);
  const fade = Math.floor(0.25 * rate);
  const raw = new Float32Array(len + fade);
  let last = 0;
  for (let i = 0; i < raw.length; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      // integrador com fuga: acumula o branco e vira um ruído grave ("marrom")
      last = (last + 0.02 * w) / 1.02;
      raw[i] = last * 3.5;
    } else raw[i] = w;
  }
  const buf = ctx.createBuffer(1, len, rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = raw[i];
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[i] = raw[i] * k + raw[len + i] * (1 - k);
  }
  return buf;
}

function getNoise(ctx: AudioContext) {
  if (!noise || noise.ctx !== ctx) noise = { ctx, white: loopableNoise(ctx, 4, false), brown: loopableNoise(ctx, 6, true) };
  return noise;
}

function loopSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function panner(ctx: AudioContext, pan: number): AudioNode {
  if (typeof ctx.createStereoPanner !== 'function') return ctx.createGain();
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  return p;
}

/** Sobe/desce o volume de um nó em rampa linear a partir do valor atual. */
function rampTo(param: AudioParam, value: number, ctx: AudioContext, seconds: number) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + seconds);
}

/* ---------------- chuva ---------------- */

class RainLayer {
  private ctx: AudioContext;
  private p: RainPreset;
  private out: GainNode;
  private sources: AudioScheduledSourceNode[] = [];
  private timer: number;
  private scheduledUntil: number;

  constructor(ctx: AudioContext, dest: AudioNode, p: RainPreset) {
    this.ctx = ctx;
    this.p = p;
    const n = getNoise(ctx);
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(dest);

    // Chiado: ruído branco entre o passa-alta e o passa-baixa
    const hiss = loopSource(ctx, n.white);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = p.highpassHz;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = p.lowpassHz;
    const hissGain = ctx.createGain();
    hissGain.gain.value = p.hiss;
    hiss.connect(hp).connect(lp).connect(hissGain).connect(this.out);

    // Oscilação lenta (LFO) da intensidade, para a chuva "respirar"
    const swell = ctx.createOscillator();
    swell.frequency.value = p.swellHz;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = p.hiss * p.swellDepth;
    swell.connect(swellDepth).connect(hissGain.gain);

    // Camada grave: outro trecho do mesmo ruído, só os graves
    const body = loopSource(ctx, n.white);
    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass';
    bodyLp.frequency.value = p.bodyHz;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = p.body;
    body.connect(bodyLp).connect(bodyGain).connect(this.out);

    const now = ctx.currentTime;
    hiss.start(now, Math.random() * n.white.duration);
    body.start(now, Math.random() * n.white.duration);
    swell.start(now);
    this.sources.push(hiss, body, swell);
    rampTo(this.out.gain, 1, ctx, FADE_S);

    // Gotas: agendadas um pouco à frente (aguenta a aba em segundo plano, onde os timers atrasam)
    this.scheduledUntil = now;
    this.timer = window.setInterval(() => this.scheduleDrops(), 100);
    this.scheduleDrops();
  }

  private scheduleDrops() {
    const ctx = this.ctx;
    const until = ctx.currentTime + 1.2;
    const from = Math.max(this.scheduledUntil, ctx.currentTime + 0.02);
    const expected = (until - from) * this.p.dropsPerSec;
    const count = Math.floor(expected + Math.random()); // média = expected
    for (let i = 0; i < count; i++) this.drop(from + Math.random() * (until - from));
    this.scheduledUntil = until;
  }

  /** Uma gota: estalo curto de ruído num passa-banda, com posição sorteada no estéreo. */
  private drop(t: number) {
    const ctx = this.ctx;
    const n = getNoise(ctx);
    const [lo, hi] = this.p.dropHz;
    const decay = 0.02 + Math.random() * 0.05;
    const src = ctx.createBufferSource();
    src.buffer = n.white;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = lo + Math.random() * (hi - lo);
    bp.Q.value = 2 + Math.random() * 6;
    const g = ctx.createGain();
    const level = this.p.drop * (0.3 + Math.random() * 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(bp).connect(g).connect(panner(ctx, (Math.random() - 0.5) * 1.6)).connect(this.out);
    src.start(t, Math.random() * (n.white.duration - 0.2), decay + 0.02);
    src.onended = () => src.disconnect();
  }

  /** Sai em fade e libera os nós. */
  stop() {
    clearInterval(this.timer);
    rampTo(this.out.gain, 0, this.ctx, FADE_S);
    const end = this.ctx.currentTime + FADE_S + 0.05;
    for (const s of this.sources) s.stop(end);
    window.setTimeout(() => this.out.disconnect(), (FADE_S + 0.3) * 1000);
  }
}

/* ---------------- trovões ---------------- */

/** Um trovão: estalo (quando perto) + estrondo grave com rolagens. */
function playThunder(ctx: AudioContext, dest: AudioNode) {
  const s = thunderStrike();
  const n = getNoise(ctx);
  const t = ctx.currentTime + 0.05;
  const pan = panner(ctx, s.pan);
  pan.connect(dest);

  const rumble = loopSource(ctx, n.brown);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  // começa mais aberto e fecha: o "rasgo" inicial vira ronco
  lp.frequency.setValueAtTime(s.cutoffHz * 3, t);
  lp.frequency.exponentialRampToValueAtTime(s.cutoffHz, t + 1.5);
  const env = ctx.createGain();
  env.gain.value = 0; // a curva começa em 0 (não pode haver outro evento no mesmo instante)
  env.gain.setValueCurveAtTime(Float32Array.from(thunderEnvelope(s, 256)), t, s.durationS);
  rumble.connect(lp).connect(env).connect(pan);
  rumble.start(t, Math.random() * n.brown.duration);
  rumble.stop(t + s.durationS + 0.05);
  rumble.onended = () => pan.disconnect();

  if (s.crack) {
    const crack = ctx.createBufferSource();
    crack.buffer = n.white;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(s.peak * 0.35, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    crack.connect(hp).connect(g).connect(pan);
    crack.start(t, Math.random() * 2, 0.4);
  }
}

/* ---------------- motor ---------------- */

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private thunderBus: GainNode | null = null;
  private rain: { type: AmbientType; layer: RainLayer } | null = null;
  private thunderTimer: number | null = null;

  update(cfg: AmbientConfig) {
    const ctx = getAudioContext();
    const dest = getAudioOutput();
    if (!ctx || !dest) return; // antes da primeira interação: o AudioHost chama de novo depois
    if (this.ctx !== ctx) {
      this.ctx = ctx;
      this.out = ctx.createGain();
      this.out.gain.value = 0;
      this.out.connect(dest);
      this.thunderBus = ctx.createGain();
      this.thunderBus.gain.value = 0;
      this.thunderBus.connect(this.out);
    }
    const out = this.out!;
    rampTo(out.gain, cfg.volume, ctx, 0.3);

    // Chuva: troca com crossfade (a antiga sai enquanto a nova entra)
    if ((this.rain?.type ?? 'none') !== cfg.type) {
      this.rain?.layer.stop();
      this.rain = cfg.type === 'none' ? null : { type: cfg.type, layer: new RainLayer(ctx, out, RAIN[cfg.type]) };
    }

    if (cfg.thunder && this.thunderTimer === null) {
      rampTo(this.thunderBus!.gain, 1, ctx, 0.2);
      this.scheduleThunder(true);
    } else if (!cfg.thunder && this.thunderTimer !== null) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
      rampTo(this.thunderBus!.gain, 0, ctx, FADE_S); // trovão em andamento sai em fade
    }
  }

  private scheduleThunder(first: boolean) {
    this.thunderTimer = window.setTimeout(() => {
      if (this.ctx && this.thunderBus) playThunder(this.ctx, this.thunderBus);
      this.scheduleThunder(false);
    }, thunderDelayMs(Math.random, first));
  }
}

export const ambient = new AmbientEngine();
