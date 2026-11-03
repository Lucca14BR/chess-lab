import { useEffect, useMemo, useState } from 'react';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, FlipVertical2, FolderOpen, RotateCcw } from 'lucide-react';
import { useGameHistory } from '@/lib/chess/useGameHistory';
import { START_FEN, positionKey, validateFen } from '@/lib/chess/board';
import { parsePgn, replayMainline } from '@/lib/chess/pgn';
import type { Segment } from '@/lib/tutor/types';
import { Page, PageHeader } from '@/components/ui/Page';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { confirm, toast } from '@/components/ui/Dialog';
import { ChessBoard, type Promotion } from '@/components/board/ChessBoard';
import { MoveList } from '@/features/board/MoveList';
import { ChatPanel } from './ChatPanel';
import { LoadDialog, type LoadChoice } from './LoadDialog';
import { positionStatus } from './position';

type MoveSegment = Extract<Segment, { kind: 'move' }>;

const sameSpot = (a: string, b: string) => positionKey(a) === positionKey(b);

/** Página Conversa: tabuleiro à esquerda (em cima no celular) e conversa com o tutor à direita. */
export default function ConversaPage() {
  const h = useGameHistory();
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [syncToken, setSyncToken] = useState(0);
  const [arrow, setArrow] = useState<{ fen: string; uci: string } | null>(null); // lance clicado na resposta
  const [loading, setLoading] = useState(false);

  // Atalhos de teclado (fora dos campos de texto)
  useEffect(() => {
    if (loading) return; // diálogo de carregar aberto: as setas são dele
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; // atalhos do navegador e do sistema
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      if (e.key === 'ArrowLeft') h.undo();
      else if (e.key === 'ArrowRight') h.redo();
      else if (e.key === 'ArrowUp') h.goTo(0);
      else if (e.key === 'ArrowDown') h.goTo(h.moves.length);
      else if (e.key.toLowerCase() === 'f') setOrientation((o) => (o === 'white' ? 'black' : 'white'));
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [h, loading]);

  const onMove = (from: string, to: string, promotion?: Promotion) => {
    if (!h.play(from, to, promotion)) setSyncToken((n) => n + 1);
  };

  // Trocar a posição descarta os lances do tabuleiro: pergunta antes, se houver lances
  const replaceBoard = async (title: string): Promise<boolean> =>
    !h.moves.length || (await confirm({ title, message: 'Os lances do tabuleiro serão trocados pela nova posição.', confirmLabel: 'Trocar' }));

  // Carregar FEN ou posição salva: o tabuleiro vira para o lado da vez
  const loadFen = (fen: string) => {
    h.reset(fen);
    setOrientation(fen.split(' ')[1] === 'b' ? 'black' : 'white');
  };

  // Posição de uma pergunta antiga ou de um lance da resposta: mantém o lado do tabuleiro
  const goToFen = async (fen: string): Promise<boolean> => {
    if (sameSpot(fen, h.fen)) return true;
    if (!(await replaceBoard('Levar o tabuleiro para esta posição?'))) return false;
    h.reset(fen);
    return true;
  };

  const showMove = async (s: MoveSegment) => {
    if (await goToFen(s.fen)) setArrow({ fen: s.fen, uci: s.uci });
  };

  const load = async (c: LoadChoice) => {
    if (!(await replaceBoard('Carregar no tabuleiro?'))) return;
    if (c.kind === 'fen') return loadFen(c.fen);
    const r = replayMainline(parsePgn(c.pgn));
    if (r.error && !r.moves.length) return toast(r.error, 'negative');
    if (r.error) toast(r.error, 'negative');
    h.load(r.startFen, r.moves.map((m) => ({ ...m })));
    setOrientation(c.userColor ?? 'white');
  };

  const resetBoard = async () => {
    if (!(await replaceBoard('Voltar à posição inicial?'))) return;
    h.reset(START_FEN);
    setOrientation('white');
  };

  const status = useMemo(() => positionStatus(h.chess), [h.chess]);
  const lastMove = h.current ? ([h.current.from, h.current.to] as [string, string]) : null;
  // A seta vale só na posição em que o lance foi lido
  const arrows = arrow && sameSpot(arrow.fen, h.fen) ? [{ from: arrow.uci.slice(0, 2), to: arrow.uci.slice(2, 4), brush: 'blue' as const }] : [];

  return (
    <Page>
      <PageHeader eyebrow="Workspace" title="Conversa" description="Converse com o seu tutor de IA sobre xadrez. A posição do tabuleiro pode ir junto com a pergunta." />
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="mx-auto w-full min-w-0" style={{ maxWidth: 'min(640px, calc(100vh - 220px))' }}>
          <div className="overflow-hidden rounded-md border border-line">
            <ChessBoard fen={h.fen} orientation={orientation} onMove={onMove} lastMove={lastMove} arrows={arrows} syncToken={syncToken} navigation={h.navigated} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted" role="status">
              {status}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => h.goTo(0)} disabled={!h.canUndo} aria-label="Início" title="Início (↑)">
                <ChevronFirst />
              </Button>
              <Button size="icon" variant="ghost" onClick={h.undo} disabled={!h.canUndo} aria-label="Voltar um lance" title="Voltar (←)">
                <ChevronLeft />
              </Button>
              <Button size="icon" variant="ghost" onClick={h.redo} disabled={!h.canRedo} aria-label="Avançar um lance" title="Avançar (→)">
                <ChevronRight />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => h.goTo(h.moves.length)} disabled={!h.canRedo} aria-label="Fim" title="Fim (↓)">
                <ChevronLast />
              </Button>
              <span className="mx-1 h-5 w-px bg-line" />
              <Button size="icon" variant="ghost" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))} aria-label="Virar o tabuleiro" title="Virar (F)">
                <FlipVertical2 />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => void resetBoard()} aria-label="Posição inicial" title="Voltar à posição inicial">
                <RotateCcw />
              </Button>
              <Button size="sm" onClick={() => setLoading(true)}>
                <FolderOpen /> Carregar
              </Button>
            </div>
          </div>
          {h.moves.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-md border border-line p-2">
              <MoveList startFen={h.startFen} moves={h.moves} cursor={h.cursor} onGo={h.goTo} notation="san" />
            </div>
          )}
          <FenForm key={h.fen} fen={h.fen} onLoad={(f) => void replaceBoard('Carregar esta FEN?').then((ok) => ok && loadFen(f))} />
        </div>

        <Card className="flex h-[70vh] min-h-[26rem] min-w-0 flex-col p-4 xl:sticky xl:top-4 xl:h-[calc(100vh-10rem)]">
          <ChatPanel fen={h.fen} onShowMove={(s) => void showMove(s)} onLoadFen={(f) => void goToFen(f)} />
        </Card>
      </div>
      <LoadDialog open={loading} onClose={() => setLoading(false)} onLoad={(c) => void load(c)} />
    </Page>
  );
}

/** Colar uma FEN (validada antes de carregar). Use key={fen} para reiniciar o campo quando a posição muda. */
function FenForm({ fen, onLoad }: { fen: string; onLoad: (fen: string) => void }) {
  const [value, setValue] = useState(fen);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const err = validateFen(value);
        setError(err);
        if (!err) onLoad(value.trim());
      }}
    >
      <label htmlFor="conversa-fen" className="mb-1 block text-[11px] tracking-wide text-ink-muted uppercase">
        FEN
      </label>
      <div className="flex gap-2">
        <Input id="conversa-fen" value={value} onChange={(e) => setValue(e.target.value)} className="min-w-0 font-mono text-xs" spellCheck={false} aria-invalid={!!error} />
        <Button type="submit" disabled={value.trim() === fen}>
          Carregar
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-negative">{error}</p>}
    </form>
  );
}
