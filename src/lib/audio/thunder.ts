/** Parâmetros puros dos trovões (a síntese fica em ambient.ts). */

export const THUNDER_TIMING = {
  firstMinMs: 4_000, // o primeiro vem logo, para a pessoa perceber que ligou
  firstMaxMs: 12_000,
  minMs: 15_000,
  maxMs: 45_000,
};

const between = (random: () => number, min: number, max: number) => min + random() * (max - min);

/** Espera até o próximo trovão. */
export function thunderDelayMs(random: () => number = Math.random, first = false): number {
  const t = THUNDER_TIMING;
  return Math.round(first ? between(random, t.firstMinMs, t.firstMaxMs) : between(random, t.minMs, t.maxMs));
}

export interface ThunderStrike {
  /** 0 = perto, 1 = longe. */
  distance: number;
  durationS: number;
  /** Ganho máximo (0–1). */
  peak: number;
  /** Corte do filtro passa-baixa: longe soa mais abafado. */
  cutoffHz: number;
  /** Subida do estrondo: perto é quase instantâneo. */
  attackS: number;
  /** Estalo agudo no início (só quando perto). */
  crack: boolean;
  /** Rolagens: novos picos menores ao longo da cauda. */
  rolls: Array<{ atS: number; level: number }>;
  /** Posição no estéreo (-1 esquerda, 1 direita). */
  pan: number;
}

/** Sorteia um trovão. Um só número decide a distância; os demais, a variação. */
export function thunderStrike(random: () => number = Math.random): ThunderStrike {
  const distance = random();
  const durationS = 3 + distance * 3 + random() * 3; // 3–9 s
  const peak = 1 - distance * 0.55; // 0.45–1
  const rollCount = 2 + Math.floor(random() * 3); // 2–4
  const rolls: ThunderStrike['rolls'] = [];
  let at = 0.25;
  for (let i = 0; i < rollCount; i++) {
    // cada rolagem um pouco depois e mais fraca que a anterior
    at += (durationS * 0.6) / rollCount * (0.5 + random() * 0.5);
    rolls.push({ atS: Math.min(at, durationS - 0.2), level: peak * (0.75 - i * 0.15) * (0.6 + random() * 0.4) });
  }
  return {
    distance,
    durationS,
    peak,
    cutoffHz: 380 - distance * 280, // 100–380 Hz
    attackS: 0.03 + distance * 0.5,
    crack: distance < 0.35,
    rolls,
    pan: (random() - 0.5) * 1.2,
  };
}

/** Um pico: sobe em linha reta durante `attack` e decai exponencialmente. */
function bump(t: number, start: number, attack: number, level: number, tau: number): number {
  if (t < start) return 0;
  if (t < start + attack) return (level * (t - start)) / attack;
  return level * Math.exp(-(t - start - attack) / tau);
}

/**
 * Curva de volume do trovão em `points` amostras (para setValueCurveAtTime):
 * estrondo principal + rolagens, com saída suave no fim para não estalar.
 */
export function thunderEnvelope(s: ThunderStrike, points: number): number[] {
  const fadeOut = Math.min(0.6, s.durationS / 4);
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / (points - 1)) * s.durationS;
    let v = bump(t, 0, s.attackS, s.peak, s.durationS * 0.18);
    for (const r of s.rolls) v += bump(t, r.atS, 0.25, r.level, s.durationS * 0.12);
    const tail = Math.min(1, (s.durationS - t) / fadeOut);
    out.push(Math.min(1, v) * Math.max(0, tail));
  }
  return out;
}
