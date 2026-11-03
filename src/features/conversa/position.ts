// Textos curtos sobre a posição do tabuleiro da página Conversa
import type { Chess } from 'chess.js';

/** FEN resumida para o selo "Posição anexada": disposição das peças e quem joga. */
export function fenSummary(fen: string): string {
  const [placement, turn] = fen.trim().split(/\s+/);
  return `${placement} · ${turn === 'b' ? 'pretas' : 'brancas'} jogam`;
}

/** Situação da posição (mesmas frases do Tabuleiro). */
export function positionStatus(c: Chess): string {
  const side = c.turn() === 'w' ? 'Brancas' : 'Pretas';
  if (c.isCheckmate()) return `Xeque-mate. ${c.turn() === 'w' ? 'Pretas' : 'Brancas'} vencem.`;
  if (c.isStalemate()) return 'Afogamento: empate.';
  if (c.isInsufficientMaterial()) return 'Empate por material insuficiente.';
  if (c.isThreefoldRepetition()) return 'Empate por tripla repetição.';
  if (c.isDraw()) return 'Empate pela regra dos 50 lances.';
  if (c.inCheck()) return `${side} em xeque.`;
  return `${side} jogam.`;
}
