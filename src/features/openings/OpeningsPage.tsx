import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpenText, Plus, Upload, Download, Trash2, ChevronLeft, ArrowLeft, Save, X } from 'lucide-react';
import { OPENINGS } from '@/data/openings';
import { db, type Color, type RepertoireEntry } from '@/lib/db/schema';
import { buildTree, findNode, treeToPgn } from '@/lib/chess/tree';
import { flattenLines, parsePgn, splitPgn } from '@/lib/chess/pgn';
import { START_FEN } from '@/lib/chess/board';
import { Page, PageHeader, Tabs } from '@/components/ui/Page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Segmented, Select, Textarea } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { Dialog, confirm, toast } from '@/components/ui/Dialog';
import { ChessBoard, MiniBoard } from '@/components/board/ChessBoard';
import { MoveTreeView } from '@/components/board/MoveTreeView';
import { downloadText, formatRelative, readFileAsText, uid } from '@/lib/utils';
import { fenAfter } from '@/lib/chess/board';
import { Chess } from 'chess.js';

const split = (s: string) => s.trim().split(/\s+/).filter(Boolean);

export default function OpeningsPage() {
  const [params, setParams] = useSearchParams();
  const repId = params.get('repertorio');
  const tab = (params.get('aba') as 'biblioteca' | 'repertorio') || (repId ? 'repertorio' : 'biblioteca');
  const [side, setSide] = useState<Color | 'todas'>('todas');

  if (repId) return <RepertoireEditor id={repId} onBack={() => setParams({ aba: 'repertorio' })} />;

  return (
    <Page>
      <PageHeader eyebrow="Aprendizado" title="Biblioteca de Aberturas" description="Estude as ideias e os planos de cada abertura, navegue pela árvore de variantes e monte o seu próprio repertório." />
      <Tabs
        value={tab}
        onChange={(t) => setParams({ aba: t })}
        tabs={[
          { value: 'biblioteca', label: 'Biblioteca' },
          { value: 'repertorio', label: 'Meu repertório' },
        ]}
      />
      {tab === 'biblioteca' ? (
        <>
          <div className="mb-4 flex justify-end">
            <Segmented<Color | 'todas'>
              size="sm"
              value={side}
              onChange={setSide}
              ariaLabel="Lado"
              options={[
                { value: 'todas', label: 'Todas' },
                { value: 'white', label: 'Para brancas' },
                { value: 'black', label: 'Para pretas' },
              ]}
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {OPENINGS.filter((o) => side === 'todas' || o.side === side).map((o) => (
              <Link key={o.id} to={`/aberturas/${o.id}`} className="group">
                <Card className="h-full overflow-hidden transition-colors group-hover:border-line-strong">
                  <MiniBoard fen={fenAfter(split(o.mainLine).slice(0, 6))} orientation={o.side} />
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="accent">{o.side === 'white' ? 'Brancas' : 'Pretas'}</Badge>
                      <Badge>{o.eco[0]}</Badge>
                    </div>
                    <h2 className="font-display mt-2 text-xl text-ink">{o.name}</h2>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-muted">{o.summary}</p>
                    <p className="mt-2 text-[11px] text-ink-faint">
                      {o.lines.length} variantes · {o.traps.length} armadilhas
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <RepertoireList />
      )}
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function RepertoireList() {
  const entries = useLiveQuery(() => db.repertoire.orderBy('updatedAt').reverse().toArray(), []);
  const [, setParams] = useSearchParams();
  const [importOpen, setImportOpen] = useState(false);

  const create = async (color: Color) => {
    const id = uid();
    const now = Date.now();
    await db.repertoire.add({ id, color, name: color === 'white' ? 'Novo repertório de brancas' : 'Novo repertório de pretas', openingId: null, lines: [], notes: '', createdAt: now, updatedAt: now });
    setParams({ repertorio: id });
  };

  if (!entries) return null;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {(['white', 'black'] as const).map((c) => {
        const list = entries.filter((e) => e.color === c);
        return (
          <Card key={c}>
            <CardHeader
              title={c === 'white' ? 'Repertório de brancas' : 'Repertório de pretas'}
              subtitle={`${list.length} ${list.length === 1 ? 'abertura' : 'aberturas'}`}
              action={
                <Button size="sm" onClick={() => void create(c)}>
                  <Plus /> Novo
                </Button>
              }
            />
            <CardBody className="space-y-2">
              {list.length === 0 ? (
                <EmptyState compact icon={<BookOpenText />} title="Vazio" description={`Adicione aberturas da biblioteca ou crie linhas próprias para ${c === 'white' ? 'brancas' : 'pretas'}.`} />
              ) : (
                list.map((e) => (
                  <button key={e.id} type="button" onClick={() => setParams({ repertorio: e.id })} className="flex w-full items-center gap-3 rounded-md border border-line bg-sunken px-3 py-2.5 text-left hover:border-line-strong">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{e.name}</span>
                      <span className="block text-xs text-ink-faint">
                        {e.lines.length} linhas · atualizado {formatRelative(e.updatedAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </CardBody>
          </Card>
        );
      })}
      <div className="lg:col-span-2">
        <Button onClick={() => setImportOpen(true)}>
          <Upload /> Importar repertório (PGN com variações)
        </Button>
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onCreated={(id) => setParams({ repertorio: id })} />
    </div>
  );
}

function ImportDialog({ open, onClose, onCreated, intoId }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void; intoId?: string }) {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState<Color>('white');
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    const games = splitPgn(text);
    const lines = games.flatMap((g) => flattenLines(parsePgn(g).moves));
    // valida cada linha descartando lances inválidos do final
    const valid = lines
      .map((l) => {
        const t = buildTree([{ moves: l }]);
        let n = t.children[0];
        let depth = 0;
        while (n) {
          depth++;
          n = n.children[0];
        }
        return l.slice(0, depth);
      })
      .filter((l) => l.length);
    if (!valid.length) return setError('Nenhuma linha válida encontrada no PGN.');
    const now = Date.now();
    if (intoId) {
      const e = await db.repertoire.get(intoId);
      if (!e) return;
      const existing = new Set(e.lines.map((l) => l.moves));
      const add = valid.map((l) => l.join(' ')).filter((m) => !existing.has(m));
      await db.repertoire.update(intoId, { lines: [...e.lines, ...add.map((m) => ({ moves: m, comment: '' }))], updatedAt: now });
      toast(`${add.length} linhas adicionadas.`, 'positive');
    } else {
      const id = uid();
      const hd = parsePgn(games[0] ?? '').headers;
      await db.repertoire.add({ id, color, name: name.trim() || hd.Event || 'Repertório importado', openingId: null, lines: valid.map((l) => ({ moves: l.join(' '), comment: '' })), notes: '', createdAt: now, updatedAt: now });
      onCreated?.(id);
      toast(`Repertório importado com ${valid.length} linhas.`, 'positive');
    }
    setText('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={intoId ? 'Importar linhas de PGN' : 'Importar repertório'}
      description="Variações entre parênteses viram linhas separadas da árvore."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void run()} disabled={!text.trim()}>
            Importar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {!intoId && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome" htmlFor="imp-name">
              <Input id="imp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Minha Caro-Kann" />
            </Field>
            <Field label="Cor" htmlFor="imp-color">
              <Select id="imp-color" value={color} onChange={(e) => setColor(e.target.value as Color)}>
                <option value="white">Brancas</option>
                <option value="black">Pretas</option>
              </Select>
            </Field>
          </div>
        )}
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="1. e4 c6 2. d4 d5 (2... g6) 3. Nc3 *" className="min-h-40 font-mono text-xs" aria-label="PGN" />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brass hover:underline">
          <Upload className="size-4" /> Abrir arquivo .pgn
          <input type="file" accept=".pgn,text/plain" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await readFileAsText(f)); e.target.value = ''; }} />
        </label>
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function RepertoireEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const entry = useLiveQuery(() => db.repertoire.get(id), [id]);
  const [path, setPath] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]); // lances jogados além da árvore
  const [importOpen, setImportOpen] = useState(false);
  const [notes, setNotes] = useState('');
  useEffect(() => setNotes(entry?.notes ?? ''), [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tree = useMemo(() => buildTree((entry?.lines ?? []).map((l) => ({ moves: split(l.moves), label: l.comment || undefined }))), [entry]);
  if (entry === undefined) return null;
  if (!entry) {
    return (
      <Page>
        <EmptyState title="Repertório não encontrado" action={<Button onClick={onBack}>Voltar</Button>} />
      </Page>
    );
  }

  const full = [...path, ...draft];
  let fen = START_FEN;
  try {
    fen = fenAfter(full);
  } catch {
    fen = START_FEN;
  }
  const node = findNode(tree, path);
  const children = draft.length ? [] : node ? node.children : tree.children;
  const opening = OPENINGS.find((o) => o.id === entry.openingId);

  const update = (patch: Partial<RepertoireEntry>) => db.repertoire.update(id, { ...patch, updatedAt: Date.now() });

  const onMove = (from: string, to: string, promotion?: string) => {
    const known = children.find((c) => c.from === from && c.to === to);
    if (known) return setPath(known.path);
    try {
      const m = new Chess(fen).move({ from, to, promotion });
      setDraft((d) => [...d, m.san]);
    } catch {
      /* lance ilegal: o tabuleiro já impede */
    }
  };

  const saveLine = async () => {
    if (!full.length) return;
    const moves = full.join(' ');
    if (entry.lines.some((l) => l.moves === moves)) return toast('Esta linha já está no repertório.');
    // substitui linhas que são prefixo da nova (evita duplicação na árvore)
    const lines = entry.lines.filter((l) => !(moves.startsWith(l.moves + ' ') && !l.comment));
    await update({ lines: [...lines, { moves, comment: '' }] });
    setPath(full);
    setDraft([]);
    toast('Linha adicionada ao repertório.', 'positive');
  };

  const deleteLine = async (moves: string) => {
    if (!(await confirm({ title: 'Remover linha?', message: moves, confirmLabel: 'Remover', danger: true }))) return;
    await update({ lines: entry.lines.filter((l) => l.moves !== moves) });
  };

  return (
    <Page>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Meu repertório
      </button>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <input defaultValue={entry.name} key={entry.id} onBlur={(e) => e.target.value.trim() && void update({ name: e.target.value.trim() })} className="font-display w-full bg-transparent text-4xl text-ink focus:outline-none" aria-label="Nome do repertório" />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Segmented size="sm" value={entry.color} onChange={(v) => void update({ color: v })} options={[{ value: 'white', label: 'Brancas' }, { value: 'black', label: 'Pretas' }]} ariaLabel="Cor" />
            {opening && (
              <Link to={`/aberturas/${opening.id}`} className="text-xs text-brass hover:underline">
                Ver “{opening.name}” na biblioteca (planos e ideias)
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setImportOpen(true)}>
            <Upload /> Importar PGN
          </Button>
          <Button onClick={() => downloadText(`${entry.name.replace(/[^\w-]+/g, '_')}.pgn`, treeToPgn(tree, { Event: entry.name }), 'application/x-chess-pgn')} disabled={!entry.lines.length}>
            <Download /> Exportar PGN
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!(await confirm({ title: 'Excluir repertório?', message: `“${entry.name}” e todas as suas linhas serão removidos.`, confirmLabel: 'Excluir', danger: true }))) return;
              await db.repertoire.delete(id);
              onBack();
            }}
          >
            <Trash2 /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-md border border-line">
            <ChessBoard fen={fen} orientation={entry.color} onMove={onMove} syncToken={full.length} arrows={children.slice(0, 5).map((c) => ({ from: c.from, to: c.to, brush: 'green' }))} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="icon-sm" variant="ghost" aria-label="Voltar um lance" disabled={!full.length} onClick={() => (draft.length ? setDraft((d) => d.slice(0, -1)) : setPath((p) => p.slice(0, -1)))}>
              <ChevronLeft />
            </Button>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-muted">{full.length ? full.join(' ') : 'Posição inicial — jogue lances para criar uma linha'}</span>
            {draft.length > 0 && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setDraft([])}>
                  <X /> Descartar
                </Button>
                <Button size="sm" variant="primary" onClick={() => void saveLine()}>
                  <Save /> Salvar linha
                </Button>
              </>
            )}
          </div>
          {draft.length > 0 && <p className="text-xs text-brass">Lances novos (fora do repertório): {draft.join(' ')}</p>}
          <Card className="p-4">
            <p className="mb-1.5 text-xs tracking-wide text-ink-muted uppercase">Anotações do repertório</p>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== entry.notes && void update({ notes })} placeholder="Planos típicos, lembretes, partidas modelo…" className="min-h-24" aria-label="Anotações do repertório" />
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Árvore" subtitle={`${entry.lines.length} linhas`} />
            <CardBody>
              {entry.lines.length ? (
                <MoveTreeView
                  tree={tree}
                  current={path}
                  onSelect={(p) => {
                    setPath(p);
                    setDraft([]);
                  }}
                />
              ) : (
                <EmptyState compact title="Nenhuma linha" description="Jogue lances no tabuleiro e clique em “Salvar linha”, ou importe um PGN." />
              )}
            </CardBody>
          </Card>
          {entry.lines.length > 0 && (
            <Card>
              <CardHeader title="Linhas" subtitle="O comentário aparece como rótulo na árvore" />
              <ul className="divide-y divide-line">
                {entry.lines.map((l) => (
                  <li key={l.moves} className="flex items-start gap-3 px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { setPath(split(l.moves)); setDraft([]); }} className="block w-full truncate text-left font-mono text-xs text-ink hover:underline" title={l.moves}>
                        {l.moves}
                      </button>
                      <input
                        defaultValue={l.comment}
                        placeholder="Comentário da linha"
                        onBlur={(e) => e.target.value !== l.comment && void update({ lines: entry.lines.map((x) => (x.moves === l.moves ? { ...x, comment: e.target.value } : x)) })}
                        className="mt-1 w-full bg-transparent text-xs text-ink-muted placeholder:text-ink-faint focus:text-ink focus:outline-none"
                        aria-label="Comentário da linha"
                      />
                    </div>
                    <Button size="icon-sm" variant="ghost" aria-label="Remover linha" onClick={() => void deleteLine(l.moves)}>
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} intoId={id} />
    </Page>
  );
}
