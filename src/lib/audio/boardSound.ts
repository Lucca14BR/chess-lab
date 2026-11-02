import { transitionSound } from './moveSound';
import { playSfx, sfxWanted } from './sfx';

/**
 * Som da troca de posição de um tabuleiro (ver transitionSound). Separado de sfx.ts
 * para o chess.js não entrar no pacote principal junto com o AudioHost.
 */
export function playMoveTransition(prev: string, next: string, lastMove: [string, string] | null, navigation: boolean): void {
  if (!sfxWanted(navigation)) return;
  const sound = transitionSound(prev, next, lastMove, navigation);
  if (sound) playSfx(sound);
}
