/** Lógica pura da playlist (ids das faixas, na ordem da lista). */

/** Próxima faixa: em ordem (voltando ao início) ou sorteada sem repetir a atual. */
export function nextTrackId(ids: string[], currentId: string | null, shuffle: boolean, random: () => number = Math.random): string | null {
  if (!ids.length) return null;
  const i = currentId ? ids.indexOf(currentId) : -1;
  if (i < 0) return shuffle ? ids[Math.floor(random() * ids.length)] : ids[0];
  if (ids.length === 1) return ids[0];
  if (!shuffle) return ids[(i + 1) % ids.length];
  const others = ids.filter((_, j) => j !== i);
  return others[Math.min(others.length - 1, Math.floor(random() * others.length))];
}

/** Depois de remover faixas: mantém a atual ou passa para a seguinte que sobrou (na ordem antiga). */
export function trackAfterRemoval(oldIds: string[], newIds: string[], currentId: string | null): string | null {
  if (!currentId || !newIds.length) return null;
  if (newIds.includes(currentId)) return currentId;
  const kept = new Set(newIds);
  const start = oldIds.indexOf(currentId);
  for (let k = 1; k <= oldIds.length; k++) {
    const id = oldIds[(start + k) % oldIds.length];
    if (kept.has(id)) return id;
  }
  return newIds[0];
}
