/** Limita a 0–1 (valores inválidos viram 0). */
export function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}

/** Volume que chega ao alto-falante: geral × específico (efeitos, música ou ambiente). */
export function effectiveVolume(master: number, specific: number): number {
  return clamp01(master) * clamp01(specific);
}
