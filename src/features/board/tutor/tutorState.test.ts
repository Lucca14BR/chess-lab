import { beforeEach, describe, expect, it, vi } from 'vitest';
import { START_FEN as START } from '@/lib/chess/board';
import { GeminiError } from '@/lib/ai/gemini';
import { db, type TutorMessage } from '@/lib/db/schema';
import type { AnalysisResult } from '@/lib/engine/stockfish';
import { threadIds } from '@/lib/tutor/key';
import { clearTutorCache, type TutorDeps } from '@/lib/tutor/service';
import { askInPosition, resetTutorUi, saveReply, tutorBusy, tutorStore } from './tutorState';

const analysis = (fen: string): AnalysisResult => ({ fen, depth: 10, bestMove: 'e2e4', lines: [{ multipv: 1, depth: 10, cp: 20, mate: null, pv: ['e2e4'] }] });

function makeDeps(generate: TutorDeps['generate']): Partial<TutorDeps> {
  return { analyze: async (fen) => analysis(fen), generate, level: async () => 'intermediario' };
}

const thread = threadIds.position(START);
const inThread = () => db.tutorMessages.where('threadId').equals(thread).sortBy('createdAt');

beforeEach(async () => {
  await db.tutorMessages.clear();
  await db.notes.clear();
  clearTutorCache();
  tutorStore.set({ pending: {}, errors: {}, notes: {} });
});

describe('tutorState', () => {
  it('marca o pedido em andamento na conversa e ignora um segundo pedido', async () => {
    let release!: () => void;
    const generate = vi.fn(() => new Promise<{ text: string; model: string }>((r) => (release = () => r({ text: 'Ok.', model: 'm' }))));
    const first = askInPosition({ fen: START, played: null, question: 'Plano?' }, false, makeDeps(generate));
    await vi.waitFor(() => expect(generate).toHaveBeenCalled());
    expect(tutorStore.get().pending[thread]).toBe('consulting');
    expect(tutorBusy()).toBe(true);
    await askInPosition({ fen: START, played: null, question: 'Outra?' }, false, makeDeps(generate));
    release();
    await first;
    expect(generate).toHaveBeenCalledTimes(1);
    expect(tutorStore.get().pending).toEqual({});
    expect((await inThread()).map((m) => m.text)).toEqual(['Plano?', 'Ok.']);
  });

  it('guarda o erro da conversa e a nova tentativa não duplica a pergunta', async () => {
    const fail = vi.fn(async () => Promise.reject(new GeminiError('offline', 'x')));
    await askInPosition({ fen: START, played: null, question: 'Plano?' }, false, makeDeps(fail));
    expect(tutorStore.get().errors[thread]).toEqual({ question: 'Plano?', message: expect.stringContaining('Sem conexão') });
    expect((await inThread()).map((m) => m.text)).toEqual(['Plano?']);

    const ok = vi.fn(async () => ({ text: 'Ok.', model: 'm' }));
    await askInPosition({ fen: START, played: null, question: 'Plano?' }, true, makeDeps(ok));
    expect(tutorStore.get().errors[thread]).toBeUndefined();
    expect((await inThread()).map((m) => m.text)).toEqual(['Plano?', 'Ok.']);
  });

  it('salva a resposta no Caderno uma vez só', async () => {
    const msg: TutorMessage = { id: 'm1', threadId: thread, role: 'tutor', text: 'Ok.', segments: null, model: 'm', fen: START, createdAt: 1 };
    const [a, b] = await Promise.all([saveReply(msg), saveReply(msg)]);
    expect(b).toBeNull();
    expect(await saveReply(msg)).toBe(a);
    expect(await db.notes.count()).toBe(1);
  });

  it('apagar os dados locais limpa notas e erros do store', () => {
    tutorStore.set({ errors: { [thread]: { question: 'q', message: 'm' } }, notes: { m1: 'n1' } });
    resetTutorUi();
    expect(tutorStore.get()).toMatchObject({ errors: {}, notes: {} });
  });
});
