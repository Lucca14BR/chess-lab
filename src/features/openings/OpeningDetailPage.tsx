import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, BookmarkPlus, Download, FlipVertical2, Plus, ChevronLeft, ChevronRight, ChevronFirst, AlertTriangle, Target, Lightbulb, Swords, MapPin } from 'lucide-react';
import { OPENINGS } from '@/data/openings';
import { db } from '@/lib/db/schema';
import { buildTree, findNode, treeToPgn } from '@/lib/chess/tree';
import { positionKey, START_FEN } from '@/lib/chess/board';
import { logActivity } from '@/lib/services/activity';
import { Page } from '@/components/ui/Page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Dialog';
import { ChessBoard } from '@/components/board/ChessBoard';
import { ExampleBoard } from '@/components/board/ExampleBoard';
import { MoveTreeView } from '@/components/board/MoveTreeView';
import { downloadText, uid } from '@/lib/utils';

const split = (s: string) => s.trim().split(/\s+/).filter(Boolean);

export default function OpeningDetailPage() {
  const { openingId } = useParams();
  const navigate = useNavigate();
  const opening = OPENINGS.find((o) => o.id === openingId);
  const [path, setPath] = useState<string[]>([]);
  const [flip, setFlip] = useState(false);
  const [resync, setResync] = useState(0);

  const tree = useMemo(() => (opening ? buildTree([{ moves: split(opening.mainLine), label: 'Linha principal' }, ...opening.lines.map((l) => ({ moves: split(l.moves), label: l.name }))]) : null), [opening]);

  useEffect(() => {
    if (opening) setPath(split(opening.mainLine).slice(0, 4));
  }, [opening]);

  const node = tree ? findNode(tree, path) : null;
  const fen = node?.fen ?? START_FEN;
  const key = positionKey(fen);
  const note = useLiveQuery(() => db.openingNotes.get(key), [key]);
  const [noteText, setNoteText] = useState('');
  useEffect(() => setNoteText(note?.text ?? ''), [note, key]);

  if (!opening || !tree) {
    return (
      <Page>
        <EmptyState title="Abertura não encontrada" action={<ButtonLink to="/aberturas">Voltar à biblioteca</ButtonLink>} />
      </Page>
    );
  }

  const orientation = (opening.side === 'white') !== flip ? 'white' : 'black';
  const children = node ? node.children : tree.children;
  const linesHere = opening.lines.filter((l) => {
    const m = split(l.moves);
    return path.every((s, i) => m[i] === s);
  });

  const saveNote = async () => {
    if (noteText === (note?.text ?? '')) return;
    if (!noteText.trim()) await db.openingNotes.delete(key);
    else await db.openingNotes.put({ key, text: noteText, updatedAt: Date.now() });
    toast('Anotação salva.', 'positive');
  };

  const addToRepertoire = async () => {
    const id = uid();
    const now = Date.now();
    await db.repertoire.add({
      id,
      color: opening.side,
      name: opening.name,
      openingId: opening.id,
      lines: [{ moves: opening.mainLine, comment: 'Linha principal' }, ...opening.lines.map((l) => ({ moves: l.moves, comment: l.name }))],
      notes: '',
      createdAt: now,
      updatedAt: now,
    });
    await logActivity({ kind: 'opening', title: `Repertório: ${opening.name}`, detail: opening.side === 'white' ? 'Brancas' : 'Pretas', link: `/aberturas?repertorio=${id}` });
    toast('Adicionada ao seu repertório. Edite as linhas como preferir.', 'positive');
    navigate(`/aberturas?repertorio=${id}`);
  };

  const savePosition = async () => {
    await db.positions.add({ id: uid(), fen, name: `${opening.name}${path.length ? ` — ${path.join(' ')}` : ''}`.slice(0, 120), notes: noteText, tags: [opening.name], favorite: false, source: 'opening', createdAt: Date.now() });
    toast('Posição salva.', 'positive');
  };

  return (
    <Page>
      <Link to="/aberturas" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Biblioteca de Aberturas
      </Link>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">Para {opening.side === 'white' ? 'brancas' : 'pretas'}</Badge>
            {opening.eco.map((e) => (
              <Badge key={e}>{e}</Badge>
            ))}
          </div>
          <h1 className="font-display mt-2 text-4xl text-ink">{opening.name}</h1>
          <p className="mt-2 max-w-3xl text-ink-muted">{opening.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadText(`${opening.id}.pgn`, treeToPgn(tree, { Event: opening.name }), 'application/x-chess-pgn')}>
            <Download /> Exportar PGN
          </Button>
          <Button variant="primary" onClick={addToRepertoire}>
            <Plus /> Adicionar ao repertório
          </Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-md border border-line">
            <ChessBoard
              fen={fen}
              orientation={orientation}
              lastMove={node ? [node.from, node.to] : null}
              movable="turn"
              onMove={(from, to) => {
                const next = children.find((c) => c.from === from && c.to === to);
                if (next) setPath(next.path);
                else {
                  setResync((n) => n + 1);
                  toast('Este lance não está na árvore desta abertura. Para explorar livremente, abra a posição no Tabuleiro.', 'info');
                }
              }}
              syncToken={path.length * 1000 + resync}
              arrows={children.slice(0, 4).map((c, i) => ({ from: c.from, to: c.to, brush: i === 0 ? 'green' : 'paleBlue' }))}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              <Button size="icon-sm" variant="ghost" onClick={() => setPath([])} aria-label="Início">
                <ChevronFirst />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setPath((p) => p.slice(0, -1))} disabled={!path.length} aria-label="Voltar">
                <ChevronLeft />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => children[0] && setPath(children[0].path)} disabled={!children.length} aria-label="Avançar na linha principal">
                <ChevronRight />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setFlip((f) => !f)} aria-label="Inverter">
                <FlipVertical2 />
              </Button>
            </div>
            <div className="flex gap-1">
              <ButtonLink to={`/tabuleiro?fen=${encodeURIComponent(fen)}`} size="sm" variant="ghost">
                  Abrir no Tabuleiro
                </ButtonLink>
              <Button size="sm" variant="ghost" onClick={savePosition}>
                <BookmarkPlus /> Salvar posição
              </Button>
            </div>
          </div>
          {children.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="self-center text-xs text-ink-muted">Continuações:</span>
              {children.map((c) => (
                <button key={c.san} type="button" onClick={() => setPath(c.path)} className="rounded border border-line bg-sunken px-2 py-0.5 font-mono text-xs text-ink hover:border-brass">
                  {c.san}
                </button>
              ))}
            </div>
          )}
          <Card className="p-4">
            <p className="mb-1.5 text-xs tracking-wide text-ink-muted uppercase">Sua anotação nesta posição</p>
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} onBlur={() => void saveNote()} placeholder="Ideias, planos, o que você costuma esquecer aqui…" className="min-h-20" aria-label="Anotação da posição" />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Árvore de variantes" subtitle={`${opening.lines.length + 1} linhas · clique em um lance para navegar`} />
            <CardBody>
              <MoveTreeView tree={tree} current={path} onSelect={setPath} />
              {linesHere.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-line pt-3">
                  {linesHere.slice(0, 4).map((l) => (
                    <div key={l.name}>
                      <button type="button" className="text-sm font-medium text-ink hover:underline" onClick={() => setPath(split(l.moves))}>
                        {l.name}
                      </button>
                      <p className="text-xs leading-relaxed text-ink-muted">{l.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <InfoList icon={<Lightbulb />} title="Ideias centrais" items={opening.ideas} />
            <Card>
              <CardHeader icon={<Target />} title="Para quem é indicada" />
              <CardBody className="text-sm leading-relaxed text-ink-muted">{opening.suitability}</CardBody>
            </Card>
            <InfoList icon={<Swords />} title="Planos das brancas" items={opening.plansWhite} />
            <InfoList icon={<Swords />} title="Planos das pretas" items={opening.plansBlack} />
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display mb-4 text-2xl text-ink">Armadilhas</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {opening.traps.map((t) => (
            <Card key={t.name}>
              <CardHeader title={t.name} subtitle={`Favorece as ${t.beneficiary === 'white' ? 'brancas' : 'pretas'}`} />
              <CardBody className="space-y-3">
                <ExampleBoard moves={split(t.moves)} orientation={t.beneficiary} initialPly={split(t.moves).length} />
                <p className="text-sm leading-relaxed text-ink-muted">{t.explanation}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<AlertTriangle />} title="Erros comuns" />
          <CardBody className="space-y-4">
            {opening.mistakes.map((m) => (
              <div key={m.title}>
                <p className="text-sm font-medium text-ink">{m.title}</p>
                {m.moves && (
                  <button type="button" className="font-mono text-xs text-brass hover:underline" onClick={() => setPath(split(m.moves!))} title="Ver no tabuleiro acima (se fizer parte da árvore)">
                    {m.moves}
                  </button>
                )}
                <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{m.explanation}</p>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<MapPin />} title="Posições-chave" />
          <CardBody className="space-y-6">
            {opening.keyPositions.map((k) => (
              <div key={k.title} className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <ExampleBoard moves={split(k.moves)} orientation={opening.side} initialPly={split(k.moves).length} />
                <div>
                  <p className="text-sm font-medium text-ink">{k.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{k.explanation}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>
    </Page>
  );
}

function InfoList({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader icon={icon} title={title} />
      <CardBody>
        <ul className="space-y-2.5">
          {items.map((x, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brass" />
              {x}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
