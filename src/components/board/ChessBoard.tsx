import { useEffect, useMemo, useRef, useState } from 'react';
import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { DrawShape } from '@lichess-org/chessground/draw';
import type { Key } from '@lichess-org/chessground/types';
import { Chess } from 'chess.js';
import { legalDests, isPromotion, turnColor } from '@/lib/chess/board';
import { useSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';

export type Promotion = 'q' | 'r' | 'b' | 'n';

export interface BoardArrowShape {
  from: string;
  to?: string;
  brush?: 'green' | 'red' | 'blue' | 'yellow' | 'paleBlue' | 'paleGreen';
}

export interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  /** Quem pode mover: 'turn' = o lado da vez; uma cor; ou false (somente visualização). */
  movable?: 'turn' | 'white' | 'black' | false;
  lastMove?: [string, string] | null;
  onMove?: (from: string, to: string, promotion?: Promotion) => void;
  arrows?: BoardArrowShape[];
  /** Altere para forçar a ressincronização do tabuleiro com `fen` (ex.: após rejeitar um lance). */
  syncToken?: number;
  className?: string;
  coordinates?: boolean;
  /** Permite desenhar setas com o botão direito. */
  drawable?: boolean;
}

const PROMO: Array<{ p: Promotion; label: string; glyph: string }> = [
  { p: 'q', label: 'Dama', glyph: '♛' },
  { p: 'r', label: 'Torre', glyph: '♜' },
  { p: 'b', label: 'Bispo', glyph: '♝' },
  { p: 'n', label: 'Cavalo', glyph: '♞' },
];

export function ChessBoard({ fen, orientation = 'white', movable = 'turn', lastMove, onMove, arrows, syncToken, className, coordinates, drawable = true }: ChessBoardProps) {
  const settings = useSettings();
  const el = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const [promo, setPromo] = useState<{ from: string; to: string; color: 'white' | 'black' } | null>(null);
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return null;
    }
  }, [fen]);
  const autoQueenRef = useRef(settings.autoQueen);
  autoQueenRef.current = settings.autoQueen;
  const chessRef = useRef(chess);
  chessRef.current = chess;

  // Cria o tabuleiro uma única vez.
  useEffect(() => {
    if (!el.current) return;
    api.current = Chessground(el.current, {
      fen,
      orientation,
      disableContextMenu: true,
      animation: { enabled: true, duration: 180 },
      movable: {
        free: false,
        events: {
          after: (orig, dest) => {
            const c = chessRef.current;
            if (c && isPromotion(c, orig, dest)) {
              if (autoQueenRef.current) onMoveRef.current?.(orig, dest, 'q');
              else setPromo({ from: orig, to: dest, color: turnColor(c) });
              return;
            }
            onMoveRef.current?.(orig, dest);
          },
        },
      },
      premovable: { enabled: false },
      highlight: { lastMove: true, check: true },
    });
    const ro = new ResizeObserver(() => api.current?.redrawAll());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      api.current?.destroy();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza posição e permissões.
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const color = chess ? turnColor(chess) : 'white';
    const canMove = movable === false ? undefined : movable === 'turn' ? color : movable;
    const canMoveNow = !!chess && canMove === color && !chess.isGameOver();
    a.set({
      fen,
      orientation,
      turnColor: color,
      check: chess?.inCheck() ? color : false,
      lastMove: lastMove ? (lastMove as Key[]) : undefined,
      coordinates: coordinates ?? settings.coordinates,
      coordinatesOnSquares: settings.coordinatesOnSquares,
      animation: { enabled: settings.animation },
      viewOnly: false,
      movable: {
        color: canMoveNow ? color : undefined,
        dests: canMoveNow && chess ? legalDests(chess) : new Map(),
        showDests: settings.showLegalMoves,
      },
      draggable: { enabled: canMoveNow, showGhost: true },
      selectable: { enabled: canMoveNow },
      drawable: { enabled: drawable, visible: true },
    });
    if (!lastMove) a.set({ lastMove: undefined });
  }, [fen, orientation, movable, lastMove, chess, settings.coordinates, settings.coordinatesOnSquares, settings.showLegalMoves, settings.animation, coordinates, drawable, syncToken]);

  useEffect(() => {
    const shapes: DrawShape[] = (arrows ?? []).map((a) => ({ orig: a.from as Key, dest: a.to as Key | undefined, brush: a.brush ?? 'green' }));
    api.current?.setAutoShapes(shapes);
  }, [arrows]);

  const choose = (p: Promotion) => {
    if (promo) onMoveRef.current?.(promo.from, promo.to, p);
    setPromo(null);
  };

  return (
    <div className={cn('relative aspect-square w-full select-none', `board-${settings.boardTheme}`, settings.pieceSet !== 'cburnett' && `pieces-${settings.pieceSet}`, className)}>
      <div ref={el} className="h-full w-full" />
      {promo && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55" role="dialog" aria-label="Escolha a peça de promoção">
          <div className="rounded-lg border border-line-strong bg-panel p-3">
            <p className="mb-2 text-center text-xs tracking-wide text-ink-muted uppercase">Promover para</p>
            <div className="flex gap-2">
              {PROMO.map((o) => (
                <button key={o.p} type="button" onClick={() => choose(o.p)} title={o.label} aria-label={o.label} className="flex size-14 items-center justify-center rounded-md border border-line bg-sunken text-4xl leading-none hover:border-brass" style={{ color: promo.color === 'white' ? '#f4ede0' : '#1a120c', textShadow: promo.color === 'white' ? '0 0 1px #000, 0 0 1px #000' : '0 0 1px #d5c1a0' }}>
                  {o.glyph}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 w-full text-xs text-ink-muted hover:text-ink"
              onClick={() => {
                setPromo(null);
                api.current?.set({ fen });
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Tabuleiro estático e leve para miniaturas. */
export function MiniBoard({ fen, orientation = 'white', className, lastMove }: { fen: string; orientation?: 'white' | 'black'; className?: string; lastMove?: [string, string] | null }) {
  return <ChessBoard fen={fen} orientation={orientation} movable={false} className={className} coordinates={false} drawable={false} lastMove={lastMove} />;
}
