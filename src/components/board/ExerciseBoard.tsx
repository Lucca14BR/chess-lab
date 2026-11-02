import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Check, RotateCcw, Eye, Lightbulb } from 'lucide-react';
import { ChessBoard, type Promotion } from './ChessBoard';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { formatLine } from '@/lib/chess/board';

/**
 * Exercício interativo: o aluno joga os lances pares da solução (SAN); os ímpares são respostas automáticas.
 * No último lance, qualquer xeque-mate é aceito quando `checkmate` for verdadeiro.
 */
export function ExerciseBoard({ fen, solution, checkmate, explanation, solved: initiallySolved, onSolved }: { fen: string; solution: string[]; checkmate?: boolean; explanation: string; solved?: boolean; onSolved?: () => void }) {
  const [pos, setPos] = useState(fen);
  const [step, setStep] = useState(0);
  const [last, setLast] = useState<[string, string] | null>(null);
  const [state, setState] = useState<'playing' | 'wrong' | 'solved' | 'revealed'>('playing');
  const [hint, setHint] = useState<string | null>(null);
  const [token, setToken] = useState(0);
  const chess = useRef(new Chess(fen));
  const timer = useRef<number | null>(null);
  const userColor = new Chess(fen).turn() === 'w' ? 'white' : 'black';

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    chess.current = new Chess(fen);
    setPos(fen);
    setStep(0);
    setLast(null);
    setHint(null);
    setState('playing');
  };
  useEffect(reset, [fen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const onMove = (from: string, to: string, promotion?: Promotion) => {
    if (state === 'solved' || state === 'revealed') return;
    const c = chess.current;
    const probe = new Chess(c.fen());
    let mv;
    try {
      mv = probe.move({ from, to, promotion });
    } catch {
      setToken((t) => t + 1);
      return;
    }
    const expected = new Chess(c.fen()).move(solution[step]);
    const isLast = step === solution.length - 1;
    const ok = (mv.from === expected.from && mv.to === expected.to && (mv.promotion ?? '') === (expected.promotion ?? '')) || (isLast && checkmate && probe.isCheckmate());
    if (!ok) {
      setState('wrong');
      setToken((t) => t + 1);
      return;
    }
    c.move({ from, to, promotion });
    setPos(c.fen());
    setLast([from, to]);
    setHint(null);
    if (isLast) {
      setState('solved');
      onSolved?.();
      return;
    }
    setState('playing');
    const reply = solution[step + 1];
    setStep(step + 2);
    timer.current = window.setTimeout(() => {
      const r = c.move(reply);
      setPos(c.fen());
      setLast([r.from, r.to]);
    }, 400);
  };

  const reveal = () => {
    reset();
    const c = new Chess(fen);
    for (const s of solution) c.move(s);
    chess.current = c;
    setPos(c.fen());
    setState('revealed');
  };

  const showHint = () => {
    const m = new Chess(chess.current.fen()).move(solution[step]);
    setHint(m.from);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,340px)_1fr]">
      <div className="overflow-hidden rounded-md border border-line">
        <ChessBoard fen={pos} orientation={userColor} movable={state === 'playing' || state === 'wrong' ? userColor : false} onMove={onMove} lastMove={last} syncToken={token} arrows={hint ? [{ from: hint, brush: 'yellow' }] : undefined} />
      </div>
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">{userColor === 'white' ? 'Brancas' : 'Pretas'} jogam. Faça o lance no tabuleiro.</p>
        {state === 'wrong' && <Alert tone="negative" title="Não é esse lance">Tente de novo ou peça uma dica.</Alert>}
        {state === 'solved' && (
          <Alert tone="positive" title="Correto!">
            {explanation}
          </Alert>
        )}
        {state === 'revealed' && (
          <Alert tone="info" title="Solução">
            <span className="font-mono text-xs">{formatLine(fen, solution)}</span>
            <span className="mt-1 block">{explanation}</span>
          </Alert>
        )}
        {initiallySolved && state === 'playing' && step === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-positive">
            <Check className="size-3.5" /> Você já resolveu este exercício.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {(state === 'playing' || state === 'wrong') && (
            <Button size="sm" onClick={showHint}>
              <Lightbulb /> Dica
            </Button>
          )}
          {state !== 'solved' && state !== 'revealed' && (
            <Button size="sm" variant="ghost" onClick={reveal}>
              <Eye /> Ver solução
            </Button>
          )}
          {(state === 'solved' || state === 'revealed' || step > 0) && (
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw /> Recomeçar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
