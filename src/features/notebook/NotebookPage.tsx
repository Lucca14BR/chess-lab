import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, Star, AlertTriangle, Trash2, FolderPlus, Folder, NotebookPen, ChessKnight, Pencil, Check } from 'lucide-react';
import { db, type NoteRow, type SavedPosition } from '@/lib/db/schema';
import { validateFen } from '@/lib/chess/board';
import { logActivity } from '@/lib/services/activity';
import { Page, PageHeader, Tabs } from '@/components/ui/Page';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { confirm, toast, Dialog } from '@/components/ui/Dialog';
import { MiniBoard } from '@/components/board/ChessBoard';
import { cn, formatDate, formatRelative, normalizeText, uid } from '@/lib/utils';

const DEFAULT_CATEGORIES = ['Geral', 'Aberturas', 'Tática', 'Estratégia', 'Meio-jogo', 'Finais', 'Partidas', 'Erros'];

type Filter = { kind: 'all' } | { kind: 'fav' } | { kind: 'mistakes' } | { kind: 'category'; value: string } | { kind: 'collection'; id: string };

export default function NotebookPage() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<'notas' | 'posicoes'>('notas');
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []);
  const collections = useLiveQuery(() => db.collections.orderBy('name').toArray(), []);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [q, setQ] = useState('');
  const selectedId = params.get('nota');
  const handledFen = useRef<string | null>(null);

  const createNote = async (patch: Partial<NoteRow> = {}) => {
    const now = Date.now();
    const note: NoteRow = {
      id: uid(),
      title: '',
      body: '',
      category: filter.kind === 'category' ? filter.value : 'Geral',
      collectionIds: filter.kind === 'collection' ? [filter.id] : [],
      tags: [],
      fen: null,
      gameRef: null,
      favorite: filter.kind === 'fav',
      isMistake: filter.kind === 'mistakes',
      createdAt: now,
      updatedAt: now,
      ...patch,
    };
    await db.notes.add(note);
    await logActivity({ kind: 'note', title: 'Nota criada', detail: note.category, link: `/caderno?nota=${note.id}` });
    setParams({ nota: note.id });
    setTab('notas');
  };

  // Atalho vindo de outras páginas: ?novaFen=
  useEffect(() => {
    const fen = params.get('novaFen');
    const game = params.get('partida');
    if (fen && handledFen.current !== fen) {
      handledFen.current = fen;
      void createNote({ fen, title: 'Posição para estudar', category: 'Geral' });
    } else if (game && handledFen.current !== game) {
      handledFen.current = game;
      void db.games.get(game).then((g) => {
        if (g) void createNote({ title: `Partida vs ${g.opponent}`, category: 'Partidas', gameRef: { kind: 'chesscom', id: g.id, label: `${g.white.username} vs ${g.black.username} · ${formatDate(g.endTime)}` } });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const categories = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...(notes ?? []).map((n) => n.category)])], [notes]);

  const filtered = useMemo(() => {
    const nq = normalizeText(q.trim());
    return (notes ?? []).filter((n) => {
      if (filter.kind === 'fav' && !n.favorite) return false;
      if (filter.kind === 'mistakes' && !n.isMistake) return false;
      if (filter.kind === 'category' && n.category !== filter.value) return false;
      if (filter.kind === 'collection' && !n.collectionIds.includes(filter.id)) return false;
      if (nq && !normalizeText(`${n.title} ${n.body} ${n.tags.join(' ')} ${n.category}`).includes(nq)) return false;
      return true;
    });
  }, [notes, filter, q]);

  const selected = notes?.find((n) => n.id === selectedId) ?? null;

  return (
    <Page>
      <PageHeader
        eyebrow="Aprendizado"
        title="Caderno de Estudos"
        description="Notas, posições, erros recorrentes e coleções — salvos automaticamente neste navegador."
        actions={
          <Button variant="primary" onClick={() => void createNote()}>
            <Plus /> Nova nota
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'notas', label: 'Notas', count: notes?.length },
          { value: 'posicoes', label: 'Posições salvas' },
        ]}
      />
      {tab === 'posicoes' ? (
        <PositionsTab onCreateNote={(p) => void createNote({ fen: p.fen, title: p.name, body: p.notes })} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[220px_300px_minmax(0,1fr)]">
          <FilterSidebar filter={filter} setFilter={setFilter} categories={categories} collections={collections ?? []} notes={notes ?? []} />
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar anotações…" className="pl-9" aria-label="Pesquisar anotações" />
            </div>
            <Card className="max-h-[70vh] overflow-y-auto p-1.5">
              {!notes ? null : filtered.length === 0 ? (
                <EmptyState compact icon={<NotebookPen />} title={notes.length ? 'Nada encontrado' : 'Caderno vazio'} description={notes.length ? 'Ajuste o filtro ou a pesquisa.' : 'Crie sua primeira nota.'} />
              ) : (
                <ul className="space-y-0.5">
                  {filtered.map((n) => (
                    <li key={n.id}>
                      <button type="button" onClick={() => setParams({ nota: n.id })} className={cn('w-full rounded-md px-3 py-2 text-left', n.id === selectedId ? 'bg-accent-soft' : 'hover:bg-hover')} aria-current={n.id === selectedId}>
                        <span className="flex items-center gap-1.5">
                          {n.favorite && <Star className="size-3 shrink-0 fill-brass text-brass" />}
                          {n.isMistake && <AlertTriangle className="size-3 shrink-0 text-warning" />}
                          <span className="truncate text-sm text-ink">{n.title || 'Sem título'}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-muted">{n.body.slice(0, 80) || 'Sem conteúdo'}</span>
                        <span className="mt-1 flex items-center gap-2 text-[10.5px] text-ink-faint">
                          {n.category} · {formatRelative(n.updatedAt)}
                          {n.fen && <ChessKnight className="size-3" />}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          {selected ? (
            <NoteEditor key={selected.id} note={selected} categories={categories} collections={collections ?? []} onDeleted={() => setParams({})} />
          ) : (
            <Card>
              <EmptyState icon={<NotebookPen />} title="Selecione ou crie uma nota" description="Registre ideias de aberturas, planos, erros que se repetem e posições para revisar." action={<Button variant="primary" onClick={() => void createNote()}><Plus /> Nova nota</Button>} />
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}

function FilterSidebar({ filter, setFilter, categories, collections, notes }: { filter: Filter; setFilter: (f: Filter) => void; categories: string[]; collections: Array<{ id: string; name: string }>; notes: NoteRow[] }) {
  const [newCol, setNewCol] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const item = (active: boolean, onClick: () => void, label: ReactNode, count: number, icon?: ReactNode) => (
    <button type="button" onClick={onClick} className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm', active ? 'bg-accent-soft text-ink' : 'text-ink-muted hover:bg-hover hover:text-ink')}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[11px] text-ink-faint tabular-nums">{count}</span>
    </button>
  );
  const saveCollection = async () => {
    if (!newCol?.trim()) return setNewCol(null);
    await db.collections.add({ id: uid(), name: newCol.trim(), description: '', createdAt: Date.now() });
    setNewCol(null);
  };
  return (
    <nav className="space-y-4 text-sm" aria-label="Filtros do caderno">
      <div className="space-y-0.5">
        {item(filter.kind === 'all', () => setFilter({ kind: 'all' }), 'Todas as notas', notes.length, <NotebookPen className="size-3.5" />)}
        {item(filter.kind === 'fav', () => setFilter({ kind: 'fav' }), 'Favoritas', notes.filter((n) => n.favorite).length, <Star className="size-3.5" />)}
        {item(filter.kind === 'mistakes', () => setFilter({ kind: 'mistakes' }), 'Erros recorrentes', notes.filter((n) => n.isMistake).length, <AlertTriangle className="size-3.5" />)}
      </div>
      <div>
        <p className="mb-1 px-2.5 text-[10px] font-semibold tracking-[0.16em] text-ink-faint uppercase">Categorias</p>
        <div className="space-y-0.5">{categories.map((c) => <div key={c}>{item(filter.kind === 'category' && filter.value === c, () => setFilter({ kind: 'category', value: c }), c, notes.filter((n) => n.category === c).length)}</div>)}</div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between px-2.5">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-ink-faint uppercase">Coleções</p>
          <Button size="icon-sm" variant="ghost" onClick={() => setNewCol('')} aria-label="Nova coleção">
            <FolderPlus />
          </Button>
        </div>
        <div className="space-y-0.5">
          {collections.map((c) =>
            editing?.id === c.id ? (
              <form
                key={c.id}
                className="flex gap-1 px-1"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (editing.name.trim()) await db.collections.update(c.id, { name: editing.name.trim() });
                  setEditing(null);
                }}
              >
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus className="h-7 text-xs" aria-label="Nome da coleção" />
                <Button size="icon-sm" type="submit" aria-label="Salvar nome">
                  <Check />
                </Button>
              </form>
            ) : (
              <div key={c.id} className="group flex items-center">
                <div className="min-w-0 flex-1">{item(filter.kind === 'collection' && filter.id === c.id, () => setFilter({ kind: 'collection', id: c.id }), c.name, notes.filter((n) => n.collectionIds.includes(c.id)).length, <Folder className="size-3.5" />)}</div>
                <Button size="icon-sm" variant="ghost" className="opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Renomear ${c.name}`} onClick={() => setEditing({ id: c.id, name: c.name })}>
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Excluir ${c.name}`}
                  onClick={async () => {
                    if (!(await confirm({ title: 'Excluir coleção?', message: `A coleção “${c.name}” será removida. As notas continuam no caderno.`, confirmLabel: 'Excluir', danger: true }))) return;
                    await db.transaction('rw', db.collections, db.notes, async () => {
                      await db.collections.delete(c.id);
                      await db.notes.where('collectionIds').equals(c.id).modify((n) => {
                        n.collectionIds = n.collectionIds.filter((x) => x !== c.id);
                      });
                    });
                    setFilter({ kind: 'all' });
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            ),
          )}
          {newCol !== null && (
            <form
              className="flex gap-1 px-1"
              onSubmit={(e) => {
                e.preventDefault();
                void saveCollection();
              }}
            >
              <Input value={newCol} onChange={(e) => setNewCol(e.target.value)} placeholder="Nome da coleção" autoFocus className="h-7 text-xs" onBlur={() => void saveCollection()} aria-label="Nome da nova coleção" />
            </form>
          )}
          {!collections.length && newCol === null && <p className="px-2.5 text-xs text-ink-faint">Agrupe notas por tema de estudo.</p>}
        </div>
      </div>
    </nav>
  );
}

function NoteEditor({ note, categories, collections, onDeleted }: { note: NoteRow; categories: string[]; collections: Array<{ id: string; name: string }>; onDeleted: () => void }) {
  const [draft, setDraft] = useState(note);
  const [saved, setSaved] = useState(true);
  const [fenInput, setFenInput] = useState(note.fen ?? '');
  const [fenError, setFenError] = useState<string | null>(null);
  const [customCat, setCustomCat] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const first = useRef(true);

  // Salvamento automático com atraso curto.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    const t = setTimeout(async () => {
      await db.notes.update(note.id, { ...draft, updatedAt: Date.now() });
      setSaved(true);
    }, 500);
    return () => clearTimeout(t);
  }, [draft, note.id]);

  const set = (patch: Partial<NoteRow>) => setDraft((d) => ({ ...d, ...patch }));

  const applyFen = () => {
    const f = fenInput.trim();
    if (!f) {
      set({ fen: null });
      setFenError(null);
      return;
    }
    const err = validateFen(f);
    setFenError(err);
    if (!err) set({ fen: f });
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start gap-2">
        <input value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Título da nota" aria-label="Título" className="font-display min-w-0 flex-1 bg-transparent text-2xl text-ink placeholder:text-ink-faint focus:outline-none" />
        <span className="pt-2 text-[11px] text-ink-faint" aria-live="polite">
          {saved ? 'Salvo' : 'Salvando…'}
        </span>
        <Button size="icon-sm" variant="ghost" onClick={() => set({ favorite: !draft.favorite })} aria-label="Favoritar" aria-pressed={draft.favorite}>
          <Star className={draft.favorite ? 'fill-brass text-brass' : ''} />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Excluir nota"
          onClick={async () => {
            if (!(await confirm({ title: 'Excluir nota?', message: 'Esta nota será apagada permanentemente.', confirmLabel: 'Excluir', danger: true }))) return;
            await db.notes.delete(note.id);
            onDeleted();
            toast('Nota excluída.');
          }}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Categoria" htmlFor="n-cat">
          {customCat ? (
            <Input id="n-cat" autoFocus placeholder="Nova categoria" onBlur={(e) => { if (e.target.value.trim()) set({ category: e.target.value.trim() }); setCustomCat(false); }} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
          ) : (
            <Select id="n-cat" value={draft.category} onChange={(e) => (e.target.value === '__new' ? setCustomCat(true) : set({ category: e.target.value }))}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__new">+ Nova categoria…</option>
            </Select>
          )}
        </Field>
        <Field label="Tags" htmlFor="n-tags" hint="Separe por vírgulas." className="sm:col-span-2">
          <Input id="n-tags" defaultValue={draft.tags.join(', ')} onBlur={(e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="siciliana, peão isolado…" />
        </Field>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={draft.isMistake} onChange={(e) => set({ isMistake: e.target.checked })} className="accent-[var(--warning)]" />
        Registrar como erro recorrente
      </label>
      <Textarea value={draft.body} onChange={(e) => set({ body: e.target.value })} placeholder="Escreva sua análise, plano ou lição aprendida…" className="min-h-56 text-[15px]" aria-label="Conteúdo da nota" />

      <div className="grid gap-4 border-t border-line pt-4 md:grid-cols-[1fr_180px]">
        <div className="space-y-3">
          <Field label="Posição (FEN)" htmlFor="n-fen" error={fenError}>
            <div className="flex gap-2">
              <Input id="n-fen" value={fenInput} onChange={(e) => setFenInput(e.target.value)} onBlur={applyFen} placeholder="Cole uma FEN" className="font-mono text-xs" spellCheck={false} />
              {draft.fen && (
                <ButtonLink to={`/tabuleiro?fen=${encodeURIComponent(draft.fen)}`}>Abrir</ButtonLink>
              )}
            </div>
          </Field>
          <Field label="Partida associada">
            {draft.gameRef ? (
              <div className="flex items-center gap-2 text-sm">
                <Link to={draft.gameRef.kind === 'chesscom' ? `/tabuleiro?partida=${draft.gameRef.id}` : `/tabuleiro?propria=${draft.gameRef.id}`} className="truncate text-brass hover:underline">
                  {draft.gameRef.label}
                </Link>
                <Button size="sm" variant="ghost" onClick={() => set({ gameRef: null })}>
                  Remover
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setLinkOpen(true)}>
                Associar partida
              </Button>
            )}
          </Field>
          {collections.length > 0 && (
            <Field label="Coleções">
              <div className="flex flex-wrap gap-1.5">
                {collections.map((c) => {
                  const on = draft.collectionIds.includes(c.id);
                  return (
                    <button key={c.id} type="button" aria-pressed={on} onClick={() => set({ collectionIds: on ? draft.collectionIds.filter((x) => x !== c.id) : [...draft.collectionIds, c.id] })} className={cn('rounded-full border px-2.5 py-0.5 text-xs', on ? 'border-brass bg-accent-soft text-ink' : 'border-line text-ink-muted hover:text-ink')}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          <p className="text-[11px] text-ink-faint">
            Criada em {formatDate(draft.createdAt)} {draft.tags.length > 0 && draft.tags.map((t) => <Badge key={t} className="ml-1">{t}</Badge>)}
          </p>
        </div>
        {draft.fen && (
          <div className="overflow-hidden rounded border border-line">
            <MiniBoard fen={draft.fen} orientation={draft.fen.split(' ')[1] === 'b' ? 'black' : 'white'} />
          </div>
        )}
      </div>
      <LinkGameDialog open={linkOpen} onClose={() => setLinkOpen(false)} onPick={(ref) => { set({ gameRef: ref }); setLinkOpen(false); }} />
    </Card>
  );
}

function LinkGameDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (r: NonNullable<NoteRow['gameRef']>) => void }) {
  const [q, setQ] = useState('');
  const data = useLiveQuery(async () => (open ? { games: await db.games.orderBy('endTime').reverse().limit(300).toArray(), own: await db.ownGames.toArray() } : null), [open]);
  const nq = normalizeText(q);
  return (
    <Dialog open={open} onClose={onClose} title="Associar partida" description="Partidas importadas do Chess.com ou salvas no Chess Lab." size="md">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por adversário ou título" className="mb-3" aria-label="Filtrar partidas" />
      <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
        {data?.own
          .filter((g) => !nq || normalizeText(g.title).includes(nq))
          .map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => onPick({ kind: 'own', id: g.id, label: g.title })} className="w-full rounded-md border border-line bg-sunken px-3 py-2 text-left text-sm hover:border-line-strong">
                {g.title} <span className="text-xs text-ink-faint">· própria</span>
              </button>
            </li>
          ))}
        {data?.games
          .filter((g) => !nq || normalizeText(g.opponent).includes(nq))
          .slice(0, 80)
          .map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => onPick({ kind: 'chesscom', id: g.id, label: `${g.white.username} vs ${g.black.username} · ${formatDate(g.endTime)}` })} className="w-full rounded-md border border-line bg-sunken px-3 py-2 text-left text-sm hover:border-line-strong">
                vs {g.opponent} <span className="text-xs text-ink-faint">· {formatDate(g.endTime)} · {g.openingName ?? ''}</span>
              </button>
            </li>
          ))}
        {data && !data.games.length && !data.own.length && <EmptyState compact title="Nenhuma partida disponível" description="Conecte o Chess.com ou salve partidas no Tabuleiro." />}
      </ul>
    </Dialog>
  );
}

function PositionsTab({ onCreateNote }: { onCreateNote: (p: SavedPosition) => void }) {
  const positions = useLiveQuery(() => db.positions.orderBy('createdAt').reverse().toArray(), []);
  const [fav, setFav] = useState(false);
  if (!positions) return null;
  const list = positions.filter((p) => !fav || p.favorite);
  return (
    <div>
      <label className="mb-3 flex w-fit items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={fav} onChange={(e) => setFav(e.target.checked)} className="accent-[var(--brass)]" /> Somente favoritas
      </label>
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<ChessKnight />} title="Nenhuma posição salva" description="Salve posições no Tabuleiro, na Biblioteca de Aberturas ou nas aulas." action={<ButtonLink to="/tabuleiro">Abrir Tabuleiro</ButtonLink>} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <MiniBoard fen={p.fen} orientation={p.fen.split(' ')[1] === 'b' ? 'black' : 'white'} />
              <div className="space-y-2 p-3">
                <input defaultValue={p.name} onBlur={(e) => e.target.value.trim() && void db.positions.update(p.id, { name: e.target.value.trim() })} className="w-full bg-transparent text-sm font-medium text-ink focus:outline-none" aria-label="Nome da posição" />
                <textarea defaultValue={p.notes} onBlur={(e) => void db.positions.update(p.id, { notes: e.target.value })} placeholder="Notas rápidas…" className="min-h-12 w-full resize-none rounded border border-line bg-sunken px-2 py-1 text-xs text-ink-muted focus:border-brass focus:outline-none" aria-label="Notas da posição" />
                <div className="flex items-center gap-1">
                  <ButtonLink to={`/tabuleiro?fen=${encodeURIComponent(p.fen)}`} size="sm">Abrir</ButtonLink>
                  <Button size="sm" variant="ghost" onClick={() => onCreateNote(p)}>
                    Criar nota
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="ml-auto" onClick={() => void db.positions.update(p.id, { favorite: !p.favorite })} aria-label="Favoritar" aria-pressed={p.favorite}>
                    <Star className={p.favorite ? 'fill-brass text-brass' : ''} />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Excluir" onClick={async () => (await confirm({ title: 'Excluir posição?', message: `“${p.name}” será removida.`, confirmLabel: 'Excluir', danger: true })) && db.positions.delete(p.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
