// Avaliação de um lance do aluno no puzzle (pura, para testar à parte).

/**
 * `step` é o índice em `moves` do lance esperado do aluno.
 * Certo no meio: avança o lance do aluno e a resposta. Certo no último: chega ao fim (concluído).
 */
export function judgeMove(moves: string[], step: number, uci: string, isMate: boolean): { correct: boolean; isLast: boolean; nextStep: number } {
  const isLast = step === moves.length - 1;
  // Na última jogada, qualquer xeque-mate é aceito (critério usado pela Lichess).
  const correct = uci === moves[step] || (isLast && isMate);
  return { correct, isLast, nextStep: !correct ? step : isLast ? step + 1 : step + 2 };
}
