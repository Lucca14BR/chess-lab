import { useEffect, useMemo, useRef, useState } from 'react';
import { Flag, Microscope, Play, RefreshCw, Undo2 } from 'lucide-react';
import { db } from '@/lib/db/schema';
import { START_FEN } from '@/lib/chess/board';
import { parsePgn } from '@/lib/chess/pgn';
import { engine } from '@/lib/engine/stockfish';
import { logActivity } from '@/lib/services/activity';
import { playSfx } from '@/lib/audio/sfx';
import { useUserName } from '@/lib/hooks';
import { RESULT_WORD } from '@/lib/labels';
import { cn, uid } from '@/lib/utils';
import { Page, PageHeader } from '@/components/ui/Page';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, Input, Segmented } from '@/components/ui/Form';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { confirm } from '@/components/ui/Dialog';
import { ChessBoard, type Promotion } from '@/components/board/ChessBoard';
import {
  MIN_THINK_MS,
  PLAY_LEVELS,
  applyMove,
  buildPlayPgn,
  canUndo,
  computerName,
  endHeadline,
  gameEnd,
  levelInfo,
  levelStrength,
  newGame,
  replay,
  resign,
  resolveColor,
  startPositionError,
  undoPair,
  type Color,
  type ColorChoice,
  type GameEnd,
  type PlayGame,
  type PlayMove,
} from './game';

type StartFrom = 'inicial' | 'fen';

const COLOR_WORD: Record<Color, string> = { white: 'Brancas', black: 'Pretas' };

function outcome(end: GameEnd, userColor: Color): 'win' | 'draw' | 'loss' {
  if (!end.winner) return 'draw';
  return end.winner === userColor ? 'win' : 'loss';
}

const END_SOUND = { win: 'Victory', loss: 'Defeat', draw: 'Draw' } as const;

async function saveFinishedGame(id: string, g: PlayGame, end: GameEnd, name: string): Promise<void> {
  const pgn = buildPlayPgn(g, { userName: name });
  const headers = parsePgn(pgn).headers;
  const now = Date.now();
  await db.ownGames.put({
    id,
    title: `Contra o computador, nível ${g.level}`,
    pgn,
    white: headers.White ?? '?',
    black: headers.Black ?? '?',
    result: end.result,
    source: 'play',
    userColor: g.userColor,
    createdAt: now,
    updatedAt: now,
  });
  // Registro de atividade à parte: se falhar, a partida continua salva.
  try {
    await logActivity({
      kind: 'game',
      title: 'Partida contra o computador',
      detail: `Nível ${g.level} · ${RESULT_WORD[outcome(end, g.userColor)]}`,
      link: `/tabuleiro?propria=${id}`,
    });
  } catch {
    /* sem registro no histórico, sem prejuízo para a partida */
  }
}

export default function PlayPage() {
  const name = useUserName();
  const [colorChoice, setColorChoice] = useState<ColorChoice>('white');
  const [level, setLevel] = useState(3);
  const [startFrom, setStartFrom] = useState<StartFrom>('inicial');
  const [fenText, setFenText] = useState('');
  const [fenError, setFenError] = useState<string | null>(null);

  const [game, setGame] = useState<PlayGame | null>(null);
  const [gameId, setGameId] = useState('');
  const [engineError, setEngineError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [syncToken, setSyncToken] = useState(0);
  const savedRef = useRef(new Set<string>());
  const endSoundRef = useRef<string | null>(null); // partida cujo fim já tocou som

  const chess = useMemo(() => (game ? replay(game) : null), [game]);
  const end = useMemo(() => (game ? gameEnd(game) : null), [game]);
  const userTurn = !!game && !!chess && (chess.turn() === 'w' ? 'white' : 'black') === game.userColor;
  const thinking = !!game && !end && !userTurn && !engineError;

  // Vez do computador: pede o lance ao motor (com a força do nível) e respeita uma pausa mínima.
  useEffect(() => {
    if (!game || end || userTurn || engineError || !chess) return;
    let cancelled = false;
    const ctrl = new AbortController();
    const started = Date.now();
    engine
      .analyze(chess.fen(), { movetimeMs: levelInfo(game.level).movetimeMs, strength: levelStrength(game.level), signal: ctrl.signal })
      .then(async (r) => {
        const wait = MIN_THINK_MS - (Date.now() - started);
        if (wait > 0) await new Promise((res) => setTimeout(res, wait));
        if (cancelled) return;
        const next = r.bestMove ? applyMove(game, r.bestMove) : null;
        if (!next) setEngineError('O computador não encontrou um lance nesta posição.');
        else setGame(next);
      })
      .catch((e: Error) => {
        if (!cancelled) setEngineError(e.message || 'Não foi possível falar com o motor.');
      });
    // Saiu da página, desistiu ou a partida mudou: interrompe e ignora o resultado.
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [game, chess, end, userTurn, engineError]);

  // Fim da partida: som de vitória, derrota ou empate (uma vez por partida)
  useEffect(() => {
    if (!game || !end || endSoundRef.current === gameId) return;
    endSoundRef.current = gameId;
    playSfx(END_SOUND[outcome(end, game.userColor)], { finale: true });
  }, [game, end, gameId]);

  // Fim da partida: salva sozinha em Minhas partidas (uma vez por partida; sem lances, não há o que salvar).
  useEffect(() => {
    if (!game || !end || !game.moves.length || savedRef.current.has(gameId)) return;
    savedRef.current.add(gameId);
    saveFinishedGame(gameId, game, end, name)
      .then(() => setSavedId(gameId))
      .catch(() => {
        savedRef.current.delete(gameId);
        setSaveError(true);
      });
  }, [game, end, gameId, name, saveAttempt]);

  const startGame = () => {
    let fen: string | undefined;
    if (startFrom === 'fen') {
      const err = startPositionError(fenText);
      setFenError(err);
      if (err) return;
      fen = fenText.trim();
    }
    setGame(newGame({ userColor: resolveColor(colorChoice), level, fen }));
    setGameId(uid());
    setEngineError(null);
    setSavedId(null);
    setSaveError(false);
  };

  const onMove = (from: string, to: string, promotion?: Promotion) => {
    const next = game && userTurn && !end ? applyMove(game, from + to + (promotion ?? '')) : null;
    if (next) setGame(next);
    else setSyncToken((n) => n + 1);
  };

  const onResign = async () => {
    const ok = await confirm({ title: 'Desistir da partida?', message: 'A partida termina agora e fica salva em Minhas partidas, para você rever com calma depois.', confirmLabel: 'Desistir', danger: true });
    if (ok) setGame((g) => (g && !gameEnd(g) ? resign(g) : g));
  };

  const last = game?.moves[game.moves.length - 1];
  const lastMove = last ? ([last.from, last.to] as [string, string]) : null;
  const previewFen = startFrom === 'fen' && fenText.trim() && !startPositionError(fenText) ? fenText.trim() : START_FEN;
  const boardFen = chess ? chess.fen() : previewFen;
  const orientation: Color = game ? game.userColor : colorChoice === 'black' ? 'black' : 'white';

  const status = !game
    ? 'Escolha como quer jogar e comece quando quiser.'
    : end
      ? 'Partida encerrada.'
      : engineError
        ? 'Partida pausada: o computador não respondeu.'
        : thinking
          ? 'Computador pensando…'
          : chess?.inCheck()
            ? 'Sua vez: você está em xeque.'
            : name
              ? `Sua vez, ${name}.`
              : 'Sua vez.';

  return (
    <Page>
      <PageHeader eyebrow="Workspace" title="Jogar" description="Uma partida contra o Stockfish, no nível que você escolher. Ao terminar, ela fica salva para você analisar com calma." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="mx-auto w-full" style={{ maxWidth: 'min(680px, calc(100vh - 170px))' }}>
          <div className="overflow-hidden rounded-md border border-line">
            <ChessBoard fen={boardFen} orientation={orientation} movable={game && !end ? game.userColor : false} premove onMove={onMove} lastMove={lastMove} syncToken={syncToken} />
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted" role="status">
            {thinking && <Spinner label="Computador pensando" />}
            {status}
          </p>
        </div>

        <Card className="self-start">
          {!game ? (
            <>
              <CardHeader icon={<Play />} title="Nova partida" subtitle="Você contra o computador, sem relógio." />
              <CardBody>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    startGame();
                  }}
                >
                  <Field label="Sua cor">
                    <Segmented<ColorChoice>
                      value={colorChoice}
                      onChange={setColorChoice}
                      ariaLabel="Sua cor"
                      options={[
                        { value: 'white', label: 'Brancas' },
                        { value: 'black', label: 'Pretas' },
                        { value: 'random', label: 'Sorteio' },
                      ]}
                    />
                  </Field>
                  <Field label="Força do computador" hint={`Nível ${level}: ${levelInfo(level).label}.`}>
                    <Segmented<string> value={String(level)} onChange={(v) => setLevel(Number(v))} ariaLabel="Nível do computador" options={PLAY_LEVELS.map((l) => ({ value: String(l.level), label: l.level }))} />
                  </Field>
                  <Field label="Começar de">
                    <Segmented<StartFrom>
                      value={startFrom}
                      onChange={(v) => {
                        setStartFrom(v);
                        setFenError(null);
                      }}
                      ariaLabel="Posição de partida"
                      options={[
                        { value: 'inicial', label: 'Posição inicial' },
                        { value: 'fen', label: 'Uma posição (FEN)' },
                      ]}
                    />
                  </Field>
                  {startFrom === 'fen' && (
                    <Field label="FEN" htmlFor="play-fen" error={fenError} hint={fenError ? undefined : 'Cole a posição; quem tem a vez na FEN joga primeiro.'}>
                      <Input
                        id="play-fen"
                        value={fenText}
                        onChange={(e) => {
                          setFenText(e.target.value);
                          setFenError(null);
                        }}
                        placeholder="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
                        className="font-mono text-xs"
                        spellCheck={false}
                        aria-invalid={!!fenError}
                      />
                    </Field>
                  )}
                  <Button type="submit" variant="primary" disabled={startFrom === 'fen' && !fenText.trim()}>
                    <Play /> Começar partida
                  </Button>
                </form>
              </CardBody>
            </>
          ) : (
            <>
              <CardHeader title={`Nível ${game.level}`} subtitle={levelInfo(game.level).label} />
              <CardBody className="space-y-4">
                <div className="space-y-1.5">
                  <PlayerRow color={game.userColor === 'white' ? 'black' : 'white'} name={computerName(game.level)} active={!end && !userTurn} />
                  <PlayerRow color={game.userColor} name={name ? `${name} (você)` : 'Você'} active={!end && userTurn} />
                </div>

                {engineError && (
                  <Alert
                    tone="negative"
                    title="O computador não respondeu"
                    action={
                      <Button size="sm" onClick={() => setEngineError(null)}>
                        <RefreshCw /> Tentar de novo
                      </Button>
                    }
                  >
                    {engineError} A partida fica pausada até você tentar de novo.
                  </Alert>
                )}

                {end && (
                  <Alert tone={end.winner === game.userColor ? 'positive' : end.winner ? 'warning' : 'info'} title={endHeadline(end, game.userColor)}>
                    {end.text}{' '}
                    {!game.moves.length ? 'Nenhum lance foi jogado, então não há partida para salvar.' : savedId ? 'A partida já está salva em Minhas partidas.' : saveError ? null : 'Salvando em Minhas partidas…'}
                  </Alert>
                )}

                {end && saveError && (
                  <Alert
                    tone="negative"
                    title="Não foi possível salvar a partida"
                    action={
                      <Button
                        size="sm"
                        onClick={() => {
                          setSaveError(false);
                          setSaveAttempt((n) => n + 1);
                        }}
                      >
                        <RefreshCw /> Tentar de novo
                      </Button>
                    }
                  >
                    Houve um problema ao gravar neste navegador. Os lances continuam aqui na tela.
                  </Alert>
                )}

                <PlayMoves startFen={game.startFen} moves={game.moves} />

                {!end && !engineError && <p className="text-xs text-ink-faint">Enquanto o computador pensa, você já pode deixar um pré-lance marcado: ele é jogado assim que chegar a sua vez, se ainda for legal.</p>}

                <div className="flex flex-wrap gap-2">
                  {end ? (
                    <>
                      {savedId && (
                        <ButtonLink to={`/tabuleiro?propria=${savedId}`} variant="primary">
                          <Microscope /> Analisar
                        </ButtonLink>
                      )}
                      <Button onClick={() => setGame(null)}>
                        <Play /> Nova partida
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => {
                          setGame((g) => g && undoPair(g));
                          setEngineError(null);
                        }} disabled={thinking || !canUndo(game)} title="Volta o seu último lance e a resposta do computador">
                        <Undo2 /> Desfazer
                      </Button>
                      <Button variant="danger" onClick={() => void onResign()}>
                        <Flag /> Desistir
                      </Button>
                    </>
                  )}
                </div>
              </CardBody>
            </>
          )}
        </Card>
      </div>
    </Page>
  );
}

function PlayerRow({ color, name, active }: { color: Color; name: string; active: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-md border px-3 py-2', active ? 'border-brass/50 bg-accent-soft' : 'border-line bg-sunken')}>
      <span className={cn('size-3.5 shrink-0 rounded-full border border-line-strong', color === 'white' ? 'bg-[#f4ede0]' : 'bg-[#1a120c]')} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{name}</span>
      <span className="text-[11px] text-ink-faint">{COLOR_WORD[color]}</span>
    </div>
  );
}

function PlayMoves({ startFen, moves }: { startFen: string; moves: PlayMove[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [moves.length]);
  const parts = startFen.split(' ');
  const startNo = Number(parts[5]) || 1;
  const blackFirst = parts[1] === 'b';
  const rows: Array<{ no: number; w?: string; b?: string }> = [];
  moves.forEach((m, i) => {
    const no = startNo + Math.floor((i + (blackFirst ? 1 : 0)) / 2);
    if (m.color === 'w' || rows.length === 0) rows.push({ no });
    const row = rows[rows.length - 1];
    if (m.color === 'w') row.w = m.san;
    else row.b = m.san;
  });
  if (!rows.length) return <p className="text-sm text-ink-muted">Nenhum lance ainda.</p>;
  return (
    <div ref={ref} className="max-h-56 overflow-y-auto rounded-md border border-line bg-sunken py-1 font-mono text-[13px]" aria-label="Lances da partida">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[2.5rem_1fr_1fr] px-2 py-0.5">
          <span className="text-ink-faint">{r.no}.</span>
          <span className="text-ink">{r.w ?? '…'}</span>
          <span className="text-ink">{r.b ?? ''}</span>
        </div>
      ))}
    </div>
  );
}
