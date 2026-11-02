import { describe, expect, it } from 'vitest'
import { judgeMove } from './puzzleStep'

// Solução: lance do adversário (índice 0), depois aluno, adversário, aluno.
const moves = ['e7e5', 'g1f3', 'b8c6', 'f1b5']

describe('judgeMove', () => {
  it('lance certo no meio avança dois (aluno + resposta)', () => {
    expect(judgeMove(moves, 1, 'g1f3', false)).toEqual({ correct: true, isLast: false, nextStep: 3 })
  })
  it('último lance certo avança até o fim (puzzle concluído)', () => {
    expect(judgeMove(moves, 3, 'f1b5', false)).toEqual({ correct: true, isLast: true, nextStep: 4 })
  })
  it('no último lance, qualquer mate vale', () => {
    expect(judgeMove(moves, 3, 'd1h5', true)).toEqual({ correct: true, isLast: true, nextStep: 4 })
  })
  it('lance errado não avança', () => {
    expect(judgeMove(moves, 1, 'd2d4', false)).toEqual({ correct: false, isLast: false, nextStep: 1 })
  })
})
