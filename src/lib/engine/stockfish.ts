// Integração com Stockfish 19 (WASM, "lite single-threaded") via Web Worker e protocolo UCI.
// Executado somente sob demanda do usuário.

export const ENGINE_NAME = 'Stockfish 19 lite (WASM)';
const ENGINE_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`;

export interface EngineLine {
  multipv: number;
  depth: number;
  /** Centipeões do ponto de vista das BRANCAS. */
  cp: number | null;
  /** Mate em N do ponto de vista das BRANCAS (positivo = brancas dão mate). */
  mate: number | null;
  pv: string[];
}

export interface AnalysisResult {
  fen: string;
  depth: number;
  lines: EngineLine[];
  bestMove: string | null;
}

export interface AnalyzeOptions {
  depth?: number;
  multiPv?: number;
  movetimeMs?: number;
  onUpdate?: (lines: EngineLine[], depth: number) => void;
  signal?: AbortSignal;
}

/** Converte "info ..." em linha de análise (avaliação no ponto de vista das brancas). */
export function parseInfo(line: string, whiteToMove: boolean): EngineLine | null {
  if (!line.startsWith('info ') || !line.includes(' pv ')) return null;
  const tok = line.split(' ');
  const get = (k: string) => {
    const i = tok.indexOf(k);
    return i >= 0 ? tok[i + 1] : undefined;
  };
  const depth = Number(get('depth'));
  const multipv = Number(get('multipv') ?? 1);
  const scoreIdx = tok.indexOf('score');
  if (scoreIdx < 0) return null;
  const kind = tok[scoreIdx + 1];
  const val = Number(tok[scoreIdx + 2]);
  const sign = whiteToMove ? 1 : -1;
  const pv = tok.slice(tok.indexOf('pv') + 1);
  return {
    depth,
    multipv,
    cp: kind === 'cp' ? val * sign : null,
    mate: kind === 'mate' ? val * sign : null,
    pv,
  };
}

export function evalToCp(l: Pick<EngineLine, 'cp' | 'mate'>): number {
  if (l.mate != null) return l.mate > 0 ? 10000 - l.mate * 10 : -10000 - l.mate * 10;
  return l.cp ?? 0;
}

export function formatEval(l: Pick<EngineLine, 'cp' | 'mate'> | null | undefined): string {
  if (!l) return '—';
  if (l.mate != null) return l.mate === 0 ? '#' : `${l.mate > 0 ? '' : '-'}M${Math.abs(l.mate)}`;
  const v = (l.cp ?? 0) / 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
}

/** Probabilidade de vitória (0–100) para as brancas, curva usada pela Lichess. */
export function winChance(cp: number): number {
  const c = Math.max(-1000, Math.min(1000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

type Job = {
  fen: string;
  opts: AnalyzeOptions;
  resolve: (r: AnalysisResult) => void;
  reject: (e: Error) => void;
};

class StockfishEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private listeners = new Set<(line: string) => void>();
  private queue: Job[] = [];
  private busy = false;

  get loaded() {
    return this.worker !== null;
  }

  private init(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      try {
        const w = new Worker(ENGINE_URL);
        this.worker = w;
        w.onmessage = (e: MessageEvent) => {
          const line = typeof e.data === 'string' ? e.data : String(e.data);
          this.listeners.forEach((l) => l(line));
        };
        w.onerror = () => {
          this.ready = null;
          this.worker = null;
          reject(new Error('Não foi possível carregar o Stockfish. Verifique se os arquivos em /stockfish estão disponíveis.'));
        };
        const onLine = (line: string) => {
          if (line === 'uciok') this.send('isready');
          if (line === 'readyok') {
            this.listeners.delete(onLine);
            resolve();
          }
        };
        this.listeners.add(onLine);
        this.send('uci');
      } catch {
        this.ready = null;
        reject(new Error('Este navegador não suporta Web Workers/WASM necessários para o motor.'));
      }
    });
    return this.ready;
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  analyze(fen: string, opts: AnalyzeOptions = {}): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fen, opts, resolve, reject });
      void this.pump();
    });
  }

  /** Interrompe a análise atual (o resultado parcial é entregue). */
  stop() {
    if (this.busy) this.send('stop');
  }

  /** Descarta análises pendentes na fila e interrompe a atual. */
  cancelAll() {
    const pending = this.queue.splice(0);
    pending.forEach((j) => j.reject(new Error('cancelado')));
    this.stop();
  }

  private async pump() {
    if (this.busy) return;
    const job = this.queue.shift();
    if (!job) return;
    this.busy = true;
    try {
      await this.init();
      job.resolve(await this.run(job.fen, job.opts));
    } catch (e) {
      job.reject(e as Error);
    } finally {
      this.busy = false;
      void this.pump();
    }
  }

  private run(fen: string, opts: AnalyzeOptions): Promise<AnalysisResult> {
    const whiteToMove = fen.split(' ')[1] !== 'b';
    const multiPv = opts.multiPv ?? 1;
    const lines = new Map<number, EngineLine>();
    let depth = 0;
    return new Promise((resolve) => {
      const onAbort = () => this.send('stop');
      opts.signal?.addEventListener('abort', onAbort);
      const onLine = (line: string) => {
        const info = parseInfo(line, whiteToMove);
        if (info && !line.includes(' upperbound') && !line.includes(' lowerbound')) {
          lines.set(info.multipv, info);
          if (info.multipv === 1) depth = info.depth;
          if (info.multipv === multiPv || multiPv === 1) {
            opts.onUpdate?.([...lines.values()].sort((a, b) => a.multipv - b.multipv), depth);
          }
        }
        if (line.startsWith('bestmove')) {
          this.listeners.delete(onLine);
          opts.signal?.removeEventListener('abort', onAbort);
          const bm = line.split(' ')[1];
          resolve({
            fen,
            depth,
            lines: [...lines.values()].sort((a, b) => a.multipv - b.multipv),
            bestMove: bm && bm !== '(none)' ? bm : null,
          });
        }
      };
      this.listeners.add(onLine);
      this.send('ucinewgame');
      this.send(`setoption name MultiPV value ${multiPv}`);
      this.send(`position fen ${fen}`);
      this.send(opts.movetimeMs ? `go movetime ${opts.movetimeMs}` : `go depth ${opts.depth ?? 16}`);
      if (opts.signal?.aborted) this.send('stop');
    });
  }
}

export const engine = new StockfishEngine();
