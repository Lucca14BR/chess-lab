import { Chess, type Move, type Square } from 'chess.js';

/** Som de um lance no tabuleiro (nomes dos arquivos dos pacotes da Lichess). */
export type MoveSound = 'Move' | 'Capture' | 'Check';

/** Xeque tem prioridade sobre captura; roque e promoção simples soam como lance comum. */
export function moveSound(move: Pick<Move, 'san' | 'captured'>): MoveSound {
  if (move.san.includes('+') || move.san.includes('#')) return 'Check';
  if (move.captured) return 'Capture';
  return 'Move';
}

/** Posição + vez: o que importa para saber se duas FENs são a mesma posição. */
const placementAndTurn = (fen: string) => fen.split(' ').slice(0, 2).join(' ');

function tryChess(fen: string): Chess | null {
  try {
    return new Chess(fen);
  } catch {
    return null;
  }
}

/** Procura o lance legal que leva de `prev` a `next` (null se não for um lance só). */
function singleMove(prev: string, next: string): Move | null {
  const c = tryChess(prev);
  if (!c) return null;
  const target = placementAndTurn(next);
  return c.moves({ verbose: true }).find((m) => placementAndTurn(m.after) === target) ?? null;
}

/**
 * Sem a posição anterior (salto pelo histórico), deduz o som pela posição atual:
 * o relógio de meio-lances zera em capturas e lances de peão; peão que muda de coluna capturou.
 */
function soundFromPosition(fen: string, lastMove: [string, string]): MoveSound | null {
  const c = tryChess(fen);
  if (!c) return null;
  if (c.inCheck()) return 'Check';
  const [from, to] = lastMove;
  const piece = c.get(to as Square);
  if (fen.split(' ')[4] !== '0' || !piece) return 'Move';
  const fileChanged = from[0] !== to[0];
  if (piece.type === 'p') return fileChanged ? 'Capture' : 'Move';
  // Promoção sem captura: avança uma casa na mesma coluna até a última fileira
  const promotionPush = !fileChanged && (to[1] === '8' || to[1] === '1') && Math.abs(Number(to[1]) - Number(from[1])) === 1;
  return promotionPush ? 'Move' : 'Capture';
}

/**
 * Som da troca de posição do tabuleiro.
 * - Um lance à frente: o som exato do lance (jogado, resposta automática ou navegação).
 * - Outro salto: só quando a página diz que foi navegação, e deduzido pelo último lance.
 */
export function transitionSound(prev: string, next: string, lastMove: [string, string] | null, navigation: boolean): MoveSound | null {
  if (prev === next) return null;
  const move = singleMove(prev, next);
  if (move) return moveSound(move);
  if (!navigation || !lastMove) return null;
  return soundFromPosition(next, lastMove);
}
