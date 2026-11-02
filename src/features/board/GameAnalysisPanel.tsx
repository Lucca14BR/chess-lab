import { useRef, useState } from 'react';
import { Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { Activity, Square } from 'lucide-react';
import { db, type GameAnalysis } from '@/lib/db/schema';
import { analyzeGame, MOVE_CLASS_LABEL } from '@/lib/engine/gameAnalysis';
import { engine } from '@/lib/engine/stockfish';
import type { HistMove } from '@/lib/chess/useGameHistory';
import { logActivity } from '@/lib/services/activity';
import { Button } from '@/components/ui/Button';
import { Alert, ProgressBar } from '@/components/ui/Feedback';
import { SourceTag } from '@/components/ui/Badge';
import { TooltipBox } from '@/components/charts/Charts';
import { cn, formatDateTime } from '@/lib/utils';
import { TutorReview } from './tutor/TutorReview';

export interface GameRef {
  kind: GameAnalysis['kind'];
  id: string;
  title: string;
  userColor?: 'white' | 'black';
}

function EvalTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { ply: number; san: string; cp: number };
  return (
    <TooltipBox title={`Lance ${Math.ceil(p.ply / 2)}${p.ply % 2 ? '.' : '...'} ${p.san}`}>
      {(p.cp / 100).toFixed(2)}
    </TooltipBox>
  );
}

export function GameAnalysisPanel({ startFen, moves, gameRef, depth, analysis, onAnalysis, onGo, onAsk }: { startFen: string; moves: HistMove[]; gameRef: GameRef | null; depth: number; analysis: GameAnalysis | null; onAnalysis: (a: GameAnalysis | null) => void; onGo: (cursor: number) => void; onAsk: (cursor: number) => void }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const run = async () => {
    if (!moves.length) return;
    const ctrl = new AbortController();
    abort.current = ctrl;
    setError(null);
    setProgress({ done: 0, total: moves.length + 1 });
    const ref = gameRef ?? { kind: 'studio' as const, id: `studio-${Date.now()}`, title: 'Partida do Tabuleiro' };
    try {
      const fens = [startFen, ...moves.map((m) => m.fen)];
      const result = await analyzeGame(
        {
          id: `${ref.kind}:${ref.id}`,
          kind: ref.kind,
          gameId: ref.id,
          title: ref.title,
          moves: moves.map((m, i) => ({ san: m.san, uci: m.uci, color: m.color, fenBefore: fens[i], fenAfter: fens[i + 1] })),
        },
        { depth, signal: ctrl.signal, onProgress: (done, total) => setProgress({ done, total }) },
      );
      if (ref.kind !== 'studio') await db.analyses.put(result);
      onAnalysis(result);
      await logActivity({ kind: 'analysis', title: `Partida analisada: ${ref.title}`, detail: `Stockfish, profundidade ${depth}`, link: '/tabuleiro' });
    } catch (e) {
      if (!ctrl.signal.aborted) setError((e as Error).message);
    } finally {
      setProgress(null);
      abort.current = null;
    }
  };

  const stop = () => {
    abort.current?.abort();
    engine.cancelAll();
  };

  const chart = analysis?.moves.map((m) => ({ ply: m.ply, san: m.san, cp: Math.max(-1000, Math.min(1000, m.evalAfter)) })) ?? [];
  const critical = analysis?.moves.filter((m) => m.classification === 'blunder' || m.classification === 'mistake' || m.classification === 'inaccuracy') ?? [];
  const stale = analysis && analysis.moves.length !== moves.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {progress ? (
          <Button onClick={stop}>
            <Square /> Cancelar
          </Button>
        ) : (
          <Button variant="primary" onClick={() => void run()} disabled={!moves.length}>
            <Activity /> {analysis ? 'Analisar de novo' : 'Analisar partida'}
          </Button>
        )}
        <span className="text-xs text-ink-faint">Stockfish · profundidade {depth} por posição</span>
      </div>
      {progress && (
        <div>
          <ProgressBar value={progress.done} max={progress.total} />
          <p className="mt-1 text-xs text-ink-muted tabular-nums">
            Posição {progress.done} de {progress.total}
          </p>
        </div>
      )}
      {error && <Alert tone="negative">{error}</Alert>}
      {!analysis && !progress && <p className="text-xs text-ink-faint">A análise avalia cada posição, mede quanto cada lance reduziu a chance de vitória e marca imprecisões, erros e erros graves, comparando com o lance sugerido pelo motor.</p>}
      {analysis && (
        <>
          {stale && <Alert tone="warning">Os lances mudaram desde esta análise. Analise de novo para atualizar.</Alert>}
          <div className="grid grid-cols-2 gap-3">
            {(['white', 'black'] as const).map((c) => {
              const s = analysis[c];
              return (
                <div key={c} className={cn('rounded-md border bg-sunken p-3', gameRef?.userColor === c ? 'border-brass/50' : 'border-line')}>
                  <p className="text-xs text-ink-muted">
                    {c === 'white' ? 'Brancas' : 'Pretas'}
                    {gameRef?.userColor === c && ' (você)'}
                  </p>
                  <p className="font-display text-2xl text-ink tabular-nums">{s.accuracy}%</p>
                  <p className="text-[11px] text-ink-faint">precisão · ACPL {s.acpl}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    <span className="text-warning">{s.inaccuracies} imprec.</span> · <span className="text-[#d38b4a]">{s.mistakes} erros</span> · <span className="text-negative">{s.blunders} graves</span>
                  </p>
                </div>
              );
            })}
          </div>
          <LineChart responsive style={{ width: '100%', height: 120 }} data={chart} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} onClick={(e) => e?.activeLabel != null && onGo(Number(e.activeLabel))}>
            <XAxis dataKey="ply" hide />
            <YAxis domain={[-1000, 1000]} hide />
            <ReferenceLine y={0} stroke="var(--border-strong)" />
            <Tooltip content={EvalTooltip} />
            <Line type="monotone" dataKey="cp" stroke="var(--brass)" dot={false} strokeWidth={1.6} isAnimationActive={false} />
          </LineChart>
          <div>
            <p className="mb-1.5 text-xs tracking-wide text-ink-muted uppercase">Lances críticos</p>
            {critical.length === 0 ? (
              <p className="text-xs text-ink-faint">Nenhuma imprecisão relevante encontrada nesta profundidade.</p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto">
                {critical.map((m) => (
                  <li key={m.ply}>
                    <button type="button" onClick={() => onGo(m.ply)} className="w-full rounded-md border border-line bg-sunken px-2.5 py-1.5 text-left text-xs hover:border-line-strong">
                      <span className={cn('font-medium', m.classification === 'blunder' ? 'text-negative' : m.classification === 'mistake' ? 'text-[#d38b4a]' : 'text-warning')}>{MOVE_CLASS_LABEL[m.classification]}</span>
                      <span className="ml-2 font-mono text-ink">
                        {Math.ceil(m.ply / 2)}
                        {m.color === 'white' ? '.' : '...'} {m.san}
                      </span>
                      <span className="ml-2 text-ink-muted">
                        −{m.winLoss}% · melhor: <span className="font-mono text-positive">{m.bestSan || '—'}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-[11px] text-ink-faint">
            <SourceTag source="calc" /> {analysis.engine}, prof. {analysis.depth}, {formatDateTime(analysis.createdAt)}. Precisão e classificações são estimativas do Chess Lab, não números oficiais do Chess.com.
          </p>
          {!stale && <TutorReview analysis={analysis} userColor={gameRef?.userColor} onGo={onGo} onAsk={onAsk} />}
        </>
      )}
    </div>
  );
}
