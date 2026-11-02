import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Undo2, Redo2, RotateCcw, FlipVertical2, Copy, Upload, Download, BookmarkPlus, Star, Trash2, Save, Scissors, NotebookPen, FolderOpen } from 'lucide-react';
import { db, type GameAnalysis } from '@/lib/db/schema';
import { useGameHistory, type HistMove } from '@/lib/chess/useGameHistory';
import { START_FEN, validateFen } from '@/lib/chess/board';
import { buildPgn, parsePgn, replayMainline, splitPgn } from '@/lib/chess/pgn';
import type { EngineLine } from '@/lib/engine/stockfish';
import { useSettings } from '@/lib/settings';
import { logActivity } from '@/lib/services/activity';
import { Page, PageHeader, Tabs } from '@/components/ui/Page';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, Input, Segmented, Textarea } from '@/components/ui/Form';
import { Alert, EmptyState } from '@/components/ui/Feedback';
import { Dialog, confirm, toast } from '@/components/ui/Dialog';
import { ChessBoard, type Promotion } from '@/components/board/ChessBoard';
import { MoveList } from './MoveList';
import { EnginePanel, EvalBar } from './EnginePanel';
import { GameAnalysisPanel, type GameRef } from './GameAnalysisPanel';
import { TutorPanel } from './tutor/TutorPanel';
import { copyToClipboard, downloadText, formatDate, readFileAsText, uid } from '@/lib/utils';

type Side = 'lances' | 'motor' | 'tutor' | 'analise' | 'salvos' | 'pgn';

function toHist(startFen: string, pgnText: string): { startFen: string; moves: HistMove[]; error: string | null; headers: Record<string, string> } {
  const game = parsePgn(pgnText);
  const r = replayMainline(game);
  return { startFen: r.startFen ?? startFen, moves: r.moves.map((m) => ({ ...m })), error: r.error, headers: game.headers };
}

export default function StudioPage() {
  const settings = useSettings();
  const h = useGameHistory();
  const [params, setParams] = useSearchParams();
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [notation, setNotation] = useState<'san' | 'uci'>('san');
  const [side, setSide] = useState<Side>('lances');
  const [engineLines, setEngineLines] = useState<EngineLine[] | null>(null);
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [gameRef, setGameRef] = useState<GameRef | null>(null);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [ownId, setOwnId] = useState<string | null>(null);
  const [syncToken, setSyncToken] = useState(0);
  const [tutorArrow, setTutorArrow] = useState<string | null>(null); // lance clicado no texto do tutor (UCI)

  // A seta do tutor vale só para a posição em que foi pedida
  useEffect(() => setTutorArrow(null), [h.fen]);

  const loadPgnText = useCallback(
    (text: string, ref: GameRef | null, ownGameId: string | null = null) => {
      const r = toHist(START_FEN, text);
      h.load(r.startFen, r.moves, 0);
      setHeaders(r.headers);
      setGameRef(ref);
      setOwnId(ownGameId);
      setAnalysis(null);
      setEngineLines(null);
      if (r.error) toast(r.error, 'negative');
      return r;
    },
    [h],
  );

  // Carregamento a partir da URL: ?fen= | ?partida=<id Chess.com> | ?propria=<id>
  useEffect(() => {
    const fen = params.get('fen');
    const partida = params.get('partida');
    const propria = params.get('propria');
    if (fen) {
      const err = validateFen(fen);
      if (err) toast(err, 'negative');
      else {
        h.reset(fen);
        setOrientation(fen.split(' ')[1] === 'b' ? 'black' : 'white');
        setGameRef(null);
        setAnalysis(null);
      }
    } else if (partida) {
      void db.games.get(partida).then(async (g) => {
        if (!g) return toast('Partida não encontrada no banco local.', 'negative');
        const ref: GameRef = { kind: 'chesscom', id: g.id, title: `${g.white.username} vs ${g.black.username}, ${formatDate(g.endTime)}`, userColor: g.userColor };
        loadPgnText(g.pgn, ref);
        setOrientation(g.userColor);
        const saved = await db.analyses.get(`chesscom:${g.id}`);
        if (saved) setAnalysis(saved);
        if (params.get('analisar') === '1') setSide('analise');
      });
    } else if (propria) {
      void db.ownGames.get(propria).then(async (g) => {
        if (!g) return toast('Partida não encontrada.', 'negative');
        loadPgnText(g.pgn, { kind: 'own', id: g.id, title: g.title }, g.id);
        const saved = await db.analyses.get(`own:${g.id}`);
        if (saved) setAnalysis(saved);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
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
  }, [h]);

  const onMove = (from: string, to: string, promotion?: Promotion) => {
    const played = h.play(from, to, promotion);
    if (!played) setSyncToken((n) => n + 1);
  };

  const status = useMemo(() => {
    const c = h.chess;
    if (c.isCheckmate()) return `Xeque-mate. ${c.turn() === 'w' ? 'Pretas' : 'Brancas'} vencem.`;
    if (c.isStalemate()) return 'Afogamento: empate.';
    if (c.isInsufficientMaterial()) return 'Empate por material insuficiente.';
    if (c.isThreefoldRepetition()) return 'Empate por tripla repetição.';
    if (c.isDraw()) return 'Empate pela regra dos 50 lances.';
    if (c.inCheck()) return `${c.turn() === 'w' ? 'Brancas' : 'Pretas'} em xeque.`;
    return `${c.turn() === 'w' ? 'Brancas' : 'Pretas'} jogam.`;
  }, [h.chess]);

  const arrows = useMemo(() => {
    const a: Array<{ from: string; to: string; brush: 'green' | 'red' | 'blue' }> = [];
    const best = engineLines?.[0]?.pv[0];
    if (best) a.push({ from: best.slice(0, 2), to: best.slice(2, 4), brush: 'green' });
    const am = analysis && analysis.moves.length === h.moves.length && h.cursor > 0 ? analysis.moves[h.cursor - 1] : null;
    if (am && (am.classification === 'mistake' || am.classification === 'blunder' || am.classification === 'inaccuracy') && am.bestUci) {
      a.push({ from: am.bestUci.slice(0, 2), to: am.bestUci.slice(2, 4), brush: 'blue' });
    }
    if (tutorArrow) a.push({ from: tutorArrow.slice(0, 2), to: tutorArrow.slice(2, 4), brush: 'blue' });
    return a;
  }, [engineLines, analysis, h.cursor, h.moves.length, tutorArrow]);

  const currentPgn = () => {
    const c = h.chess;
    const res = c.isCheckmate() ? (c.turn() === 'w' ? '0-1' : '1-0') : c.isDraw() ? '1/2-1/2' : headers.Result ?? '*';
    const keep: Record<string, string> = {};
    for (const k of ['Event', 'Site', 'Date', 'White', 'Black', 'WhiteElo', 'BlackElo', 'TimeControl', 'ECO', 'Link']) if (headers[k]) keep[k] = headers[k];
    return buildPgn({ headers: { ...keep, Result: res }, startFen: h.startFen, moves: h.moves, result: res });
  };

  const resetBoard = async () => {
    if (h.moves.length && !(await confirm({ title: 'Reiniciar o tabuleiro?', message: 'Os lances atuais serão descartados (salve a partida antes, se quiser guardá-la).', confirmLabel: 'Reiniciar' }))) return;
    h.reset(START_FEN);
    setHeaders({});
    setGameRef(null);
    setOwnId(null);
    setAnalysis(null);
    setEngineLines(null);
    setParams({});
  };

  const lastMove = h.current ? ([h.current.from, h.current.to] as [string, string]) : null;
  const currentAnalysis = analysis && h.cursor > 0 && analysis.moves.length === h.moves.length ? analysis.moves[h.cursor - 1] : null;

  return (
    <Page>
      <PageHeader
        eyebrow="Workspace"
        title="Tabuleiro"
        description={gameRef ? gameRef.title : 'Jogue, estude posições, comente lances e analise com o Stockfish.'}
        actions={
          <>
            <SaveGameButton pgn={currentPgn} ownId={ownId} onSaved={setOwnId} defaultTitle={gameRef?.title ?? ''} />
            <ButtonLink to={`/caderno?novaFen=${encodeURIComponent(h.fen)}`}>
                <NotebookPen /> Nota com esta posição
              </ButtonLink>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="mx-auto w-full" style={{ maxWidth: 'min(680px, calc(100vh - 170px))' }}>
          <div className="flex gap-2">
            <EvalBar line={engineLines?.[0]} orientation={orientation} />
            <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-line">
              <ChessBoard fen={h.fen} orientation={orientation} onMove={onMove} lastMove={lastMove} arrows={arrows} syncToken={syncToken} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted" role="status">
              {status}
              {currentAnalysis && currentAnalysis.classification !== 'good' && currentAnalysis.classification !== 'best' && (
                <span className="ml-2 text-xs">
                  · jogado <span className="font-mono text-ink">{currentAnalysis.san}</span>, motor preferia <span className="font-mono text-positive">{currentAnalysis.bestSan}</span> (seta azul)
                </span>
              )}
            </p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => h.goTo(0)} disabled={!h.canUndo} aria-label="Início" title="Início (↑)">
                <ChevronFirst />
              </Button>
              <Button size="icon" variant="ghost" onClick={h.undo} disabled={!h.canUndo} aria-label="Lance anterior" title="Anterior (←)">
                <ChevronLeft />
              </Button>
              <Button size="icon" variant="ghost" onClick={h.redo} disabled={!h.canRedo} aria-label="Próximo lance" title="Próximo (→)">
                <ChevronRight />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => h.goTo(h.moves.length)} disabled={!h.canRedo} aria-label="Fim" title="Fim (↓)">
                <ChevronLast />
              </Button>
              <span className="mx-1 h-5 w-px bg-line" />
              <Button size="icon" variant="ghost" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))} aria-label="Inverter tabuleiro" title="Inverter (F)">
                <FlipVertical2 />
              </Button>
              <Button size="icon" variant="ghost" onClick={resetBoard} aria-label="Reiniciar" title="Reiniciar posição">
                <RotateCcw />
              </Button>
            </div>
          </div>
          <FenBar fen={h.fen} onLoad={(f) => { h.reset(f); setGameRef(null); setAnalysis(null); setHeaders({}); setOwnId(null); }} />
        </div>

        <Card className="self-start p-4">
          <Tabs<Side>
            value={side}
            onChange={setSide}
            className="mb-4"
            tabs={[
              { value: 'lances', label: 'Lances' },
              { value: 'motor', label: 'Motor' },
              { value: 'tutor', label: 'Tutor' },
              { value: 'analise', label: 'Análise' },
              { value: 'salvos', label: 'Salvos' },
              { value: 'pgn', label: 'PGN' },
            ]}
          />
          {side === 'lances' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Segmented size="sm" value={notation} onChange={setNotation} options={[{ value: 'san', label: 'SAN' }, { value: 'uci', label: 'UCI' }]} ariaLabel="Notação" />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={h.undo} disabled={!h.canUndo}>
                    <Undo2 /> Desfazer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={h.redo} disabled={!h.canRedo}>
                    <Redo2 /> Refazer
                  </Button>
                </div>
              </div>
              <MoveList startFen={h.startFen} moves={h.moves} cursor={h.cursor} onGo={h.goTo} notation={notation} analysis={analysis && analysis.moves.length === h.moves.length ? analysis.moves : null} />
              {h.canRedo && (
                <Button size="sm" variant="ghost" onClick={h.truncate}>
                  <Scissors /> Apagar lances após a posição atual
                </Button>
              )}
              <Field label={h.cursor > 0 ? `Comentário em ${Math.ceil(h.cursor / 2)}${h.current?.color === 'w' ? '.' : '...'} ${h.current?.san}` : 'Comentário'} htmlFor="move-comment" hint={h.cursor === 0 ? 'Jogue ou selecione um lance para comentá-lo.' : 'Salvo junto com o PGN.'}>
                <Textarea id="move-comment" value={h.current?.comment ?? ''} disabled={h.cursor === 0} onChange={(e) => h.setComment(h.cursor - 1, e.target.value)} placeholder="Ideia do lance, plano, alternativa…" className="min-h-20" />
              </Field>
            </div>
          )}
          {side === 'motor' && <EnginePanel fen={h.fen} depth={settings.engineDepth} onLines={setEngineLines} onPlayPv={(sans) => sans[0] && h.playSan(sans[0])} />}
          {side === 'analise' && <GameAnalysisPanel startFen={h.startFen} moves={h.moves} gameRef={gameRef} depth={settings.analysisDepth} analysis={analysis} onAnalysis={setAnalysis} onGo={h.goTo} onAsk={(cursor) => { h.goTo(cursor); setSide('tutor'); }} />}
          {side === 'tutor' && <TutorPanel fen={h.fen} played={currentAnalysis} onShowMove={setTutorArrow} />}
          {side === 'salvos' && <SavedPanel fen={h.fen} onLoadFen={(f) => { h.reset(f); setGameRef(null); setAnalysis(null); }} onLoadOwn={(id) => setParams({ propria: id })} />}
          {side === 'pgn' && <PgnPanel getPgn={currentPgn} onImport={(text) => loadPgnText(text, null)} />}
        </Card>
      </div>
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function FenBar({ fen, onLoad }: { fen: string; onLoad: (fen: string) => void }) {
  const [value, setValue] = useState(fen);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setValue(fen);
    setError(null);
  }, [fen]);
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
      <label htmlFor="fen" className="mb-1 block text-[11px] tracking-wide text-ink-muted uppercase">
        FEN
      </label>
      <div className="flex gap-2">
        <Input id="fen" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono text-xs" spellCheck={false} aria-invalid={!!error} />
        <Button type="button" size="icon" onClick={async () => toast((await copyToClipboard(fen)) ? 'FEN copiada.' : 'Não foi possível copiar.', 'info')} aria-label="Copiar FEN" title="Copiar FEN">
          <Copy />
        </Button>
        <Button type="submit" disabled={value.trim() === fen}>
          Carregar
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-negative">{error}</p>}
    </form>
  );
}

/* ------------------------------------------------------------------ */

function SaveGameButton({ pgn, ownId, onSaved, defaultTitle }: { pgn: () => string; ownId: string | null; onSaved: (id: string) => void; defaultTitle: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const save = async () => {
    const text = pgn();
    const g = parsePgn(text);
    const now = Date.now();
    const id = ownId ?? uid();
    const existing = ownId ? await db.ownGames.get(ownId) : undefined;
    await db.ownGames.put({ id, title: title.trim() || 'Partida sem título', pgn: text, white: g.headers.White ?? '?', black: g.headers.Black ?? '?', result: g.result, source: 'studio', createdAt: existing?.createdAt ?? now, updatedAt: now });
    onSaved(id);
    setOpen(false);
    toast('Partida salva em “Minhas partidas”.', 'positive');
  };
  return (
    <>
      <Button
        onClick={async () => {
          setTitle(ownId ? (await db.ownGames.get(ownId))?.title ?? '' : defaultTitle);
          setOpen(true);
        }}
      >
        <Save /> {ownId ? 'Salvar alterações' : 'Salvar partida'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={ownId ? 'Atualizar partida' : 'Salvar partida'}
        description="As partidas próprias ficam guardadas no Chess Lab, separadas das importadas do Chess.com."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={save}>
              Salvar
            </Button>
          </>
        }
      >
        <Field label="Título" htmlFor="game-title">
          <Input id="game-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Treino da Siciliana" autoFocus />
        </Field>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */

function SavedPanel({ fen, onLoadFen, onLoadOwn }: { fen: string; onLoadFen: (fen: string) => void; onLoadOwn: (id: string) => void }) {
  const positions = useLiveQuery(() => db.positions.orderBy('createdAt').reverse().toArray(), []);
  const own = useLiveQuery(() => db.ownGames.orderBy('updatedAt').reverse().toArray(), []);
  const [name, setName] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);

  const savePosition = async () => {
    await db.positions.add({ id: uid(), fen, name: name.trim() || 'Posição sem nome', notes: '', tags: [], favorite: false, source: 'studio', createdAt: Date.now() });
    await logActivity({ kind: 'position', title: `Posição salva: ${name.trim() || 'sem nome'}`, link: `/tabuleiro?fen=${encodeURIComponent(fen)}` });
    setName('');
    toast('Posição salva.', 'positive');
  };

  const list = (positions ?? []).filter((p) => !onlyFav || p.favorite);

  return (
    <div className="space-y-5">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void savePosition();
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da posição atual" aria-label="Nome da posição" />
        <Button type="submit" variant="primary">
          <BookmarkPlus /> Salvar
        </Button>
      </form>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs tracking-wide text-ink-muted uppercase">Posições salvas</p>
          <label className="flex items-center gap-1.5 text-xs text-ink-muted">
            <input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} className="accent-[var(--brass)]" /> só favoritas
          </label>
        </div>
        {list.length === 0 ? (
          <EmptyState compact title="Nenhuma posição" description="Salve posições para revisitá-las ou usá-las em notas." />
        ) : (
          <ul className="max-h-60 space-y-1 overflow-y-auto">
            {list.map((p) => (
              <li key={p.id} className="flex items-center gap-1 rounded-md border border-line bg-sunken px-2 py-1.5">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onLoadFen(p.fen)} title={p.fen}>
                  <span className="block truncate text-sm text-ink">{p.name}</span>
                  <span className="block truncate font-mono text-[10px] text-ink-faint">{p.fen}</span>
                </button>
                <Button size="icon-sm" variant="ghost" onClick={() => void db.positions.update(p.id, { favorite: !p.favorite })} aria-label={p.favorite ? 'Remover dos favoritos' : 'Favoritar'} aria-pressed={p.favorite}>
                  <Star className={p.favorite ? 'fill-brass text-brass' : ''} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Excluir posição"
                  onClick={async () => {
                    if (await confirm({ title: 'Excluir posição?', message: `“${p.name}” será removida.`, confirmLabel: 'Excluir', danger: true })) await db.positions.delete(p.id);
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs tracking-wide text-ink-muted uppercase">Minhas partidas</p>
        {!own?.length ? (
          <EmptyState compact title="Nenhuma partida própria" description="Use “Salvar partida” para guardar o que você jogou ou analisou aqui." />
        ) : (
          <ul className="max-h-60 space-y-1 overflow-y-auto">
            {own.map((g) => (
              <li key={g.id} className="flex items-center gap-1 rounded-md border border-line bg-sunken px-2 py-1.5">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onLoadOwn(g.id)}>
                  <span className="block truncate text-sm text-ink">{g.title}</span>
                  <span className="block text-[11px] text-ink-faint">
                    {formatDate(g.updatedAt)} · {g.result}
                  </span>
                </button>
                <Button size="icon-sm" variant="ghost" aria-label="Abrir" onClick={() => onLoadOwn(g.id)}>
                  <FolderOpen />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Excluir partida"
                  onClick={async () => {
                    if (await confirm({ title: 'Excluir partida?', message: `“${g.title}” e sua análise serão removidas.`, confirmLabel: 'Excluir', danger: true })) {
                      await db.ownGames.delete(g.id);
                      await db.analyses.delete(`own:${g.id}`);
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PgnPanel({ getPgn, onImport }: { getPgn: () => string; onImport: (text: string) => void }) {
  const [text, setText] = useState('');
  const [choices, setChoices] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tryImport = (raw: string) => {
    setError(null);
    const games = splitPgn(raw);
    if (!games.length) return setError('Nenhuma partida encontrada no texto.');
    if (games.length > 1) return setChoices(games);
    const r = replayMainline(parsePgn(games[0]));
    if (r.error && !r.moves.length) return setError(r.error);
    onImport(games[0]);
    toast('PGN importado.', 'positive');
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs tracking-wide text-ink-muted uppercase">Exportar</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={async () => toast((await copyToClipboard(getPgn())) ? 'PGN copiado.' : 'Não foi possível copiar.')}>
            <Copy /> Copiar PGN
          </Button>
          <Button onClick={() => downloadText(`chess-lab-${new Date().toISOString().slice(0, 10)}.pgn`, getPgn(), 'application/x-chess-pgn')}>
            <Download /> Baixar .pgn
          </Button>
        </div>
      </div>
      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs tracking-wide text-ink-muted uppercase">Importar</p>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'[Event "..."]\n\n1. e4 e5 2. Nf3 Nc6 *'} className="min-h-32 font-mono text-xs" spellCheck={false} aria-label="Texto PGN" />
        {error && <Alert tone="negative" className="mt-2">{error}</Alert>}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => tryImport(text)} disabled={!text.trim()}>
            Importar texto
          </Button>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-line bg-panel-2 px-4 text-sm hover:border-line-strong">
            <Upload className="size-4" /> Abrir arquivo
            <input type="file" accept=".pgn,text/plain" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) tryImport(await readFileAsText(f)); e.target.value = ''; }} />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-ink-faint">A linha principal e os comentários são carregados; variações entre parênteses são ignoradas no Tabuleiro (use a Biblioteca de Aberturas para árvores de variantes).</p>
      </div>
      <Dialog open={!!choices} onClose={() => setChoices(null)} title="Escolha a partida" description={`O arquivo contém ${choices?.length ?? 0} partidas.`} size="md">
        <ul className="space-y-1">
          {choices?.map((g, i) => {
            const hd = parsePgn(g).headers;
            return (
              <li key={i}>
                <button
                  type="button"
                  className="w-full rounded-md border border-line bg-sunken px-3 py-2 text-left text-sm hover:border-line-strong"
                  onClick={() => {
                    onImport(g);
                    setChoices(null);
                    toast('PGN importado.', 'positive');
                  }}
                >
                  <span className="text-ink">
                    {hd.White ?? '?'} vs {hd.Black ?? '?'}
                  </span>
                  <span className="ml-2 text-xs text-ink-muted">
                    {hd.Date ?? ''} · {hd.Result ? (hd.Result === '1-0' ? '1-0' : hd.Result === '0-1' ? '0-1' : hd.Result === '1/2-1/2' ? '½-½' : hd.Result) : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </div>
  );
}

