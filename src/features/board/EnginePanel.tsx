import { useEffect, useRef, useState } from 'react';
import { Cpu, Square, Play } from 'lucide-react';
import { engine, formatEval, evalToCp, type EngineLine } from '@/lib/engine/stockfish';
import { formatLine, pvToSan } from '@/lib/chess/board';
import { Button } from '@/components/ui/Button';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';

export interface EngineState {
  lines: EngineLine[];
  depth: number;
  running: boolean;
  fen: string | null;
}

/** Análise de posição sob demanda (MultiPV 3). */
export function EnginePanel({ fen, depth, onLines, onPlayPv }: { fen: string; depth: number; onLines: (lines: EngineLine[] | null) => void; onPlayPv: (sans: string[]) => void }) {
  const [state, setState] = useState<EngineState>({ lines: [], depth: 0, running: false, fen: null });
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const [follow, setFollow] = useState(false);

  const run = async (target = fen) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setError(null);
    setState({ lines: [], depth: 0, running: true, fen: target });
    try {
      const r = await engine.analyze(target, {
        depth,
        multiPv: 3,
        signal: ctrl.signal,
        onUpdate: (lines, d) => {
          if (ctrl.signal.aborted) return;
          setState({ lines, depth: d, running: true, fen: target });
          onLines(lines);
        },
      });
      if (abort.current === ctrl) {
        setState({ lines: r.lines, depth: r.depth, running: false, fen: target });
        onLines(r.lines);
      }
    } catch (e) {
      if ((e as Error).message !== 'cancelado') setError((e as Error).message);
      setState((s) => ({ ...s, running: false }));
    }
  };

  const stop = () => {
    abort.current?.abort();
    engine.stop();
    setState((s) => ({ ...s, running: false }));
  };

  // Ao mudar de posição: descarta a análise antiga; reanalisa só se o modo "acompanhar" estiver ligado.
  useEffect(() => {
    if (state.fen && state.fen !== fen) {
      abort.current?.abort();
      engine.stop();
      setState({ lines: [], depth: 0, running: false, fen: null });
      onLines(null);
      if (follow) void run(fen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  useEffect(() => () => abort.current?.abort(), []);

  const top = state.lines[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {state.running ? (
          <Button onClick={stop}>
            <Square /> Parar
          </Button>
        ) : (
          <Button variant="primary" onClick={() => void run()}>
            <Play /> Analisar posição
          </Button>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="accent-[var(--positive)]" />
          Reanalisar ao navegar
        </label>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-faint">
          {state.running && <Spinner />}
          <Cpu className="size-3.5" /> prof. {state.depth || '—'}/{depth}
        </span>
      </div>
      {error && <Alert tone="negative">{error}</Alert>}
      {top ? (
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-3">
            <span className={cn('font-display text-3xl tabular-nums', evalToCp(top) >= 0 ? 'text-ink' : 'text-ink-muted')}>{formatEval(top)}</span>
            <span className="text-xs text-ink-muted">avaliação (ponto de vista das brancas)</span>
          </div>
          {state.lines.map((l) => {
            const sans = pvToSan(state.fen ?? fen, l.pv, 10);
            return (
              <button key={l.multipv} type="button" onClick={() => onPlayPv(sans.slice(0, 1))} className="flex w-full items-start gap-2 rounded-md border border-line bg-sunken px-2.5 py-1.5 text-left hover:border-line-strong" title="Clique para jogar o primeiro lance desta linha">
                <span className="w-12 shrink-0 font-mono text-[12px] text-ink tabular-nums">{formatEval(l)}</span>
                <span className="font-mono text-[12px] leading-relaxed text-ink-muted">{formatLine(state.fen ?? fen, sans)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        !state.running && <p className="text-xs text-ink-faint">O motor só roda quando você pede. Ele mostra a avaliação, o melhor lance (seta verde) e as 3 principais variantes.</p>
      )}
    </div>
  );
}

export function EvalBar({ line, orientation }: { line: EngineLine | null | undefined; orientation: 'white' | 'black' }) {
  const cp = line ? evalToCp(line) : 0;
  const whitePct = line ? Math.max(3, Math.min(97, 50 + 50 * (2 / (1 + Math.exp(-0.004 * cp)) - 1))) : 50;
  return (
    <div className={cn('relative w-3 overflow-hidden rounded-sm border border-line bg-[#2a2420]', orientation === 'black' && 'rotate-180')} title={line ? `Avaliação: ${formatEval(line)}` : 'Sem análise'} aria-label={line ? `Avaliação ${formatEval(line)}` : 'Sem avaliação'}>
      <div className="absolute right-0 bottom-0 left-0 bg-[#efe6d6] transition-all duration-300" style={{ height: `${whitePct}%` }} />
    </div>
  );
}
