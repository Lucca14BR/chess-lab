import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Unlink, Download, Upload, Trash2, ImagePlus, Cloud, Palette, ChessKnight, Cpu, Database, Info, UserRound, X } from 'lucide-react';
import { db, type ImportScope } from '@/lib/db/schema';
import { useAccount } from '@/lib/hooks';
import { useStore } from '@/lib/store';
import { syncStore, syncAccount, cancelSync, disconnectAccount } from '@/lib/chesscom/sync';
import { chessCom } from '@/lib/chesscom/client';
import { BOARD_THEMES, PIECE_SETS, applyTheme, getTheme, setSetting, useSettings, type ThemeMode } from '@/lib/settings';
import { exportBackup, importBackup, clearAllData, storageSummary } from '@/lib/services/backup';
import { resetTutorUi } from '@/features/board/tutor/tutorState';
import { Page, PageHeader } from '@/components/ui/Page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Segmented, Select, Switch } from '@/components/ui/Form';
import { Alert, ProgressBar } from '@/components/ui/Feedback';
import { confirm, toast } from '@/components/ui/Dialog';
import { ChessBoard } from '@/components/board/ChessBoard';
import { ConnectChessCom } from '@/features/account/ConnectChessCom';
import { TutorSection } from './TutorSection';
import { cn, downloadText, formatDateTime, formatRelative, readFileAsDataUrl, readFileAsText } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <Page className="max-w-[1100px]">
      <PageHeader eyebrow="Sistema" title="Configurações" description="Conta do Chess.com, aparência, tabuleiro, motor de análise e seus dados locais." />
      <div className="space-y-5">
        <AccountSection />
        <ProfileSection />
        <AppearanceSection />
        <BoardSection />
        <EngineSection />
        <TutorSection />
        <DataSection />
        <AboutSection />
      </div>
    </Page>
  );
}

function AccountSection() {
  const account = useAccount();
  const sync = useStore(syncStore);
  const counts = useLiveQuery(async () => ({ games: await db.games.count(), archives: await db.archives.count() }), []);
  const archives = useLiveQuery(() => db.archives.orderBy('url').reverse().toArray(), []);
  const [pgnMonth, setPgnMonth] = useState('');
  const [downloading, setDownloading] = useState(false);

  const disconnect = async () => {
    const ok = await confirm({
      title: 'Desconectar Chess.com?',
      message: 'O perfil, as estatísticas e as partidas importadas serão removidos do Chess Lab. Suas notas, puzzles, aulas, treinos e partidas próprias não são afetados.',
      confirmLabel: 'Desconectar e remover',
      danger: true,
    });
    if (!ok) return;
    await disconnectAccount(false);
    toast('Conta desconectada.', 'info');
  };

  const changeScope = async (scope: ImportScope) => {
    await db.account.update('chesscom', { importScope: scope });
    toast('Escopo de importação atualizado. Sincronizando…');
    void syncAccount();
  };

  const downloadPgn = async () => {
    const a = archives?.find((x) => x.url === pgnMonth);
    if (!a || !account) return;
    setDownloading(true);
    try {
      const pgn = await chessCom.monthPgn(account.username, a.year, a.month);
      downloadText(`${account.username}-${a.year}-${String(a.month).padStart(2, '0')}.pgn`, pgn, 'application/x-chess-pgn');
    } catch (e) {
      toast((e as Error).message, 'negative');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={<Cloud />} title="Conta Chess.com" subtitle="Integração somente leitura via API pública. Nenhuma senha é solicitada." />
      <CardBody>
        {account === undefined ? null : !account ? (
          <ConnectChessCom />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              {account.profile.avatar && <img src={account.profile.avatar} alt="" className="size-14 rounded-md object-cover" referrerPolicy="no-referrer" />}
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl text-ink">{account.displayUsername}</p>
                <p className="text-xs text-ink-muted">Conectado em {formatDateTime(account.connectedAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {sync.running ? (
                  <Button onClick={cancelSync}>
                    <X /> Cancelar sincronização
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => void syncAccount({ force: true })}>
                    <RefreshCw /> Atualizar dados
                  </Button>
                )}
                <Button variant="danger" onClick={disconnect}>
                  <Unlink /> Desconectar
                </Button>
              </div>
            </div>

            {sync.running && (
              <div className="rounded-md border border-line bg-sunken p-3">
                <p className="text-sm text-ink">{sync.step}</p>
                {sync.total > 0 && (
                  <>
                    <ProgressBar value={sync.done} max={sync.total} className="mt-2" />
                    <p className="mt-1 text-xs text-ink-muted tabular-nums">
                      {sync.done} de {sync.total} meses · {sync.newGames} partidas novas
                    </p>
                  </>
                )}
                {sync.rateLimitedUntil && <p className="mt-1 text-xs text-warning">O Chess.com pediu para reduzir o ritmo (429). Nova tentativa automática em instantes.</p>}
              </div>
            )}
            {!sync.running && (sync.error || account.lastSyncError) && (
              <Alert tone="negative" title="A última sincronização falhou">
                {sync.error ?? account.lastSyncError} Os dados já importados continuam disponíveis.
              </Alert>
            )}

            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info2 label="Perfil atualizado" value={account.lastProfileSyncAt ? formatRelative(account.lastProfileSyncAt) : '—'} />
              <Info2 label="Estatísticas" value={account.lastStatsSyncAt ? formatRelative(account.lastStatsSyncAt) : '—'} />
              <Info2 label="Partidas sincronizadas" value={account.lastGamesSyncAt ? formatRelative(account.lastGamesSyncAt) : 'nunca'} />
              <Info2 label="No banco local" value={counts ? `${counts.games} partidas · ${counts.archives} meses` : '—'} />
            </dl>
            <p className="text-xs text-ink-faint">A API pública do Chess.com pode levar até 12 horas para refletir partidas recentes. Meses encerrados ficam em cache e não são baixados de novo; o mês atual é revalidado a cada sincronização.</p>

            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <Field label="Importar partidas" htmlFor="scope" hint="Ampliar o período busca os meses que faltam, um por vez.">
                <Select id="scope" value={account.importScope} onChange={(e) => void changeScope(e.target.value as ImportScope)} disabled={sync.running}>
                  <option value="3m">Últimos 3 meses</option>
                  <option value="12m">Últimos 12 meses</option>
                  <option value="all">Todo o histórico</option>
                </Select>
              </Field>
              <Field label="Baixar PGN de um mês" htmlFor="pgn-month" hint="Usa o endpoint /games/{AAAA}/{MM}/pgn do Chess.com.">
                <div className="flex gap-2">
                  <Select id="pgn-month" value={pgnMonth} onChange={(e) => setPgnMonth(e.target.value)}>
                    <option value="">Selecione…</option>
                    {archives?.map((a) => (
                      <option key={a.url} value={a.url}>
                        {String(a.month).padStart(2, '0')}/{a.year} · {a.gameCount} partidas
                      </option>
                    ))}
                  </Select>
                  <Button onClick={downloadPgn} disabled={!pgnMonth || downloading}>
                    <Download /> PGN
                  </Button>
                </div>
              </Field>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

function ProfileSection() {
  const s = useSettings();
  const [name, setName] = useState(s.displayName);
  useEffect(() => setName(s.displayName), [s.displayName]);
  return (
    <Card>
      <CardHeader icon={<UserRound />} title="Perfil local" />
      <CardBody>
        <Field label="Como devemos chamar você?" htmlFor="display-name" hint="Aparece na saudação do Painel, na barra lateral e nas conversas com o tutor. Fica salvo só neste navegador.">
          <Input id="display-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={() => void setSetting('displayName', name.trim())} placeholder="Seu nome" className="max-w-sm" />
        </Field>
      </CardBody>
    </Card>
  );
}

function AppearanceSection() {
  const s = useSettings();
  const [theme, setTheme] = useState<ThemeMode>(getTheme());
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Escolha um arquivo de imagem.', 'negative');
    if (f.size > 4 * 1024 * 1024) return toast('Imagem muito grande (máx. 4 MB).', 'negative');
    await setSetting('headerImage', await readFileAsDataUrl(f));
    toast('Imagem do cabeçalho atualizada.', 'positive');
  };
  return (
    <Card>
      <CardHeader icon={<Palette />} title="Aparência" />
      <CardBody className="space-y-5">
        <Field label="Tema">
          <Segmented
            value={theme}
            onChange={(v) => {
              setTheme(v);
              applyTheme(v);
            }}
            options={[
              { value: 'dark', label: 'Escuro' },
              { value: 'light', label: 'Claro' },
            ]}
          />
        </Field>
        <Field label="Imagem do cabeçalho do Painel" hint="Por padrão, o Chess Lab desenha uma biblioteca com peças. Você pode usar uma imagem própria (fica salva localmente).">
          <div className="flex flex-wrap items-center gap-3">
            {s.headerImage && <img src={s.headerImage} alt="Cabeçalho atual" className="h-14 w-40 rounded border border-line object-cover" />}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
            <Button onClick={() => fileRef.current?.click()}>
              <ImagePlus /> Escolher imagem
            </Button>
            {s.headerImage && (
              <Button variant="ghost" onClick={() => void setSetting('headerImage', null)}>
                Restaurar padrão
              </Button>
            )}
          </div>
        </Field>
      </CardBody>
    </Card>
  );
}

function BoardSection() {
  const s = useSettings();
  return (
    <Card>
      <CardHeader icon={<ChessKnight />} title="Tabuleiro" />
      <CardBody>
        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          <div className="space-y-5">
            <Field label="Tema do tabuleiro">
              <div className="flex flex-wrap gap-2">
                {BOARD_THEMES.map((t) => (
                  <button key={t.id} type="button" onClick={() => void setSetting('boardTheme', t.id)} className={cn('rounded-md border p-1.5 text-xs', s.boardTheme === t.id ? 'border-brass text-ink' : 'border-line text-ink-muted hover:border-line-strong')} aria-pressed={s.boardTheme === t.id}>
                    <span className="grid size-10 grid-cols-2 overflow-hidden rounded-sm">
                      <span style={{ background: t.light }} />
                      <span style={{ background: t.dark }} />
                      <span style={{ background: t.dark }} />
                      <span style={{ background: t.light }} />
                    </span>
                    <span className="mt-1 block">{t.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Conjunto de peças">
              <Segmented value={s.pieceSet} onChange={(v) => void setSetting('pieceSet', v)} options={PIECE_SETS.map((p) => ({ value: p.id, label: p.label }))} />
            </Field>
            <div className="divide-y divide-line">
              <Switch id="coords" label="Mostrar coordenadas" checked={s.coordinates} onChange={(v) => void setSetting('coordinates', v)} />
              <Switch id="coords-sq" label="Coordenadas em todas as casas" description="Útil para treinar a visualização do tabuleiro." checked={s.coordinatesOnSquares} onChange={(v) => void setSetting('coordinatesOnSquares', v)} />
              <Switch id="dests" label="Indicar lances legais" checked={s.showLegalMoves} onChange={(v) => void setSetting('showLegalMoves', v)} />
              <Switch id="anim" label="Animar peças" checked={s.animation} onChange={(v) => void setSetting('animation', v)} />
              <Switch id="queen" label="Promover automaticamente a dama" checked={s.autoQueen} onChange={(v) => void setSetting('autoQueen', v)} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs tracking-wide text-ink-muted uppercase">Pré-visualização</p>
            <ChessBoard fen="r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4" movable={false} lastMove={['g8', 'f6']} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function EngineSection() {
  const s = useSettings();
  return (
    <Card>
      <CardHeader icon={<Cpu />} title="Motor de análise" subtitle="Stockfish 19 (versão lite, WebAssembly) executado localmente no seu navegador, apenas quando você pede." />
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <Field label="Profundidade na análise de posição" htmlFor="depth" hint="Maior = mais preciso e mais lento.">
          <Select id="depth" value={s.engineDepth} onChange={(e) => void setSetting('engineDepth', Number(e.target.value))}>
            {[12, 14, 16, 18, 20, 22, 24].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Profundidade na análise de partida" htmlFor="adepth" hint="Aplicada a cada posição da partida.">
          <Select id="adepth" value={s.analysisDepth} onChange={(e) => void setSetting('analysisDepth', Number(e.target.value))}>
            {[8, 10, 12, 14, 16].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      </CardBody>
    </Card>
  );
}

function DataSection() {
  const s = useSettings();
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof storageSummary>> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void storageSummary().then(setSummary);
  }, []);

  const doExport = async () => {
    downloadText(`chess-lab-backup-${new Date().toISOString().slice(0, 10)}.json`, await exportBackup(), 'application/json');
    toast('Backup exportado.', 'positive');
  };
  const doImport = async (f: File | undefined) => {
    if (!f) return;
    const ok = await confirm({ title: 'Restaurar backup?', message: 'Os dados atuais do Chess Lab neste navegador serão substituídos pelos do arquivo.', confirmLabel: 'Restaurar', danger: true });
    if (!ok) return;
    try {
      const n = await importBackup(await readFileAsText(f));
      toast(`Backup restaurado (${n} registros).`, 'positive');
      setSummary(await storageSummary());
    } catch (e) {
      toast((e as Error).message, 'negative');
    }
  };
  const doClear = async () => {
    const ok = await confirm({ title: 'Apagar todos os dados locais?', message: 'Notas, posições, progresso, treinos, partidas importadas, configurações e a chave do Gemini serão apagados deste navegador. Exporte um backup antes se quiser guardá-los. Esta ação não pode ser desfeita.', confirmLabel: 'Apagar tudo', danger: true });
    if (!ok) return;
    await clearAllData();
    resetTutorUi();
    toast('Dados locais apagados.');
    setSummary(await storageSummary());
  };

  const fmtMb = (b: number | null) => (b == null ? '—' : `${(b / 1024 / 1024).toFixed(1)} MB`);
  return (
    <Card>
      <CardHeader icon={<Database />} title="Dados locais" subtitle="Tudo fica no IndexedDB deste navegador (arquitetura local-first)." />
      <CardBody className="space-y-4">
        <Switch id="autosync" label="Sincronizar ao abrir o app" description="Atualiza os dados do Chess.com quando a última sincronização tem mais de 12 horas." checked={s.autoSync} onChange={(v) => void setSetting('autoSync', v)} />
        {summary && (
          <div className="grid gap-3 rounded-md border border-line bg-sunken p-3 text-xs text-ink-muted sm:grid-cols-4">
            <span>Uso: <span className="text-ink">{fmtMb(summary.usage)}</span></span>
            <span>Notas: <span className="text-ink">{summary.counts.notes}</span></span>
            <span>Tentativas de puzzle: <span className="text-ink">{summary.counts.puzzleAttempts}</span></span>
            <span>Armazenamento persistente: <span className={summary.persisted ? 'text-positive' : 'text-warning'}>{summary.persisted ? 'sim' : 'não garantido'}</span></span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={doExport}>
            <Download /> Exportar backup (JSON)
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void doImport(e.target.files?.[0])} />
          <Button onClick={() => fileRef.current?.click()}>
            <Upload /> Restaurar backup
          </Button>
          <Button variant="danger" onClick={doClear}>
            <Trash2 /> Apagar dados locais
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function AboutSection() {
  return (
    <Card>
      <CardHeader icon={<Info />} title="Sobre e fontes de dados" />
      <CardBody className="space-y-3 text-sm text-ink-muted">
        <p>
          <strong className="text-ink">Chess Lab</strong> é um aplicativo pessoal e independente, <strong className="text-ink">sem afiliação, patrocínio ou endosso do Chess.com</strong>. Os dados de jogador vêm da{' '}
          <a className="text-brass hover:underline" href="https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it" target="_blank" rel="noreferrer">
            API pública (PubAPI) do Chess.com
          </a>
          , somente leitura, sem scraping.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>Puzzles: base pública da Lichess (database.lichess.org), licença CC0.</li>
          <li>Motor: Stockfish 19 (GPLv3), compilação WebAssembly de Nathan Rugg (stockfish.js).</li>
          <li>Explicações do tutor: Gemini API (Google), com a chave do usuário.</li>
          <li>Regras: chess.js (BSD-2). Tabuleiro: Chessground, da Lichess (GPLv3).</li>
          {PIECE_SETS.map((p) => (
            <li key={p.id}>
              Peças {p.label}: {p.author} ({p.license}).
            </li>
          ))}
          <li>Fontes: Cormorant Garamond, Inter e JetBrains Mono (SIL OFL), servidas localmente.</li>
        </ul>
      </CardBody>
    </Card>
  );
}
