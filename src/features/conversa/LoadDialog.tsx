import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { RESULT_WORD } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import { Segmented } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Feedback';

type Source = 'posicoes' | 'minhas' | 'chesscom';

const RECENT_GAMES = 50;

/** O que carregar no tabuleiro: uma posição (FEN) ou uma partida (PGN, aberta na posição final e navegável). */
export type LoadChoice = { kind: 'fen'; fen: string } | { kind: 'pgn'; pgn: string; userColor?: 'white' | 'black' };

/** Carregar posição salva, partida própria ou partida do Chess.com. */
export function LoadDialog({ open, onClose, onLoad }: { open: boolean; onClose: () => void; onLoad: (c: LoadChoice) => void }) {
  const [source, setSource] = useState<Source>('posicoes');
  const positions = useLiveQuery(() => (open && source === 'posicoes' ? db.positions.orderBy('createdAt').reverse().toArray() : []), [open, source]);
  const own = useLiveQuery(() => (open && source === 'minhas' ? db.ownGames.orderBy('updatedAt').reverse().toArray() : []), [open, source]);
  const games = useLiveQuery(() => (open && source === 'chesscom' ? db.games.orderBy('endTime').reverse().limit(RECENT_GAMES).toArray() : []), [open, source]);

  const pick = (c: LoadChoice) => {
    onLoad(c);
    onClose();
  };

  const rowClass = 'w-full rounded-md border border-line bg-sunken px-3 py-2 text-left hover:border-line-strong';

  return (
    <Dialog open={open} onClose={onClose} title="Carregar no tabuleiro" description="Escolha uma posição salva ou uma partida. A partida abre na posição final; use as setas para voltar lance a lance." size="md">
      <Segmented
        value={source}
        onChange={setSource}
        ariaLabel="Origem"
        className="mb-4"
        options={[
          { value: 'posicoes', label: 'Posições salvas' },
          { value: 'minhas', label: 'Minhas partidas' },
          { value: 'chesscom', label: 'Chess.com' },
        ]}
      />
      {source === 'posicoes' &&
        (!positions?.length ? (
          <EmptyState compact title="Nenhuma posição salva" description="Salve posições no Tabuleiro (aba Salvos) para trazê-las para a conversa." />
        ) : (
          <ul className="space-y-1">
            {positions.map((p) => (
              <li key={p.id}>
                <button type="button" className={rowClass} onClick={() => pick({ kind: 'fen', fen: p.fen })} title={p.fen}>
                  <span className="block truncate text-sm text-ink">{p.name}</span>
                  <span className="block truncate font-mono text-[10px] text-ink-faint">{p.fen}</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      {source === 'minhas' &&
        (!own?.length ? (
          <EmptyState compact title="Nenhuma partida própria" description="As partidas salvas no Tabuleiro ou jogadas em Jogar aparecem aqui." />
        ) : (
          <ul className="space-y-1">
            {own.map((g) => (
              <li key={g.id}>
                <button type="button" className={rowClass} onClick={() => pick({ kind: 'pgn', pgn: g.pgn, userColor: g.userColor })}>
                  <span className="block truncate text-sm text-ink">{g.title}</span>
                  <span className="block text-[11px] text-ink-faint">
                    {formatDate(g.updatedAt)} · {g.result}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      {source === 'chesscom' &&
        (!games?.length ? (
          <EmptyState compact title="Nenhuma partida importada" description="Conecte sua conta do Chess.com em Configurações para importar suas partidas." />
        ) : (
          <ul className="space-y-1">
            {games.map((g) => (
              <li key={g.id}>
                <button type="button" className={rowClass} onClick={() => pick({ kind: 'pgn', pgn: g.pgn, userColor: g.userColor })}>
                  <span className="block truncate text-sm text-ink">vs {g.opponent}</span>
                  <span className="block truncate text-[11px] text-ink-faint">
                    {formatDate(g.endTime)} · {RESULT_WORD[g.result]} · {g.openingName ?? 'Abertura desconhecida'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      {source === 'chesscom' && games?.length === RECENT_GAMES && <p className="mt-2 text-[11px] text-ink-faint">Mostrando as {RECENT_GAMES} partidas mais recentes.</p>}
    </Dialog>
  );
}
