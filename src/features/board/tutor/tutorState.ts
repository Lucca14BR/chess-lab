// Estado dos pedidos ao tutor fora dos componentes: sobrevive à troca de abas.
// Chaveado pelo id da conversa (posição, revisão ou página Conversa); um pedido por vez no app todo.
import { createStore } from '@/lib/store';
import { db, type AnalyzedMove, type GameAnalysis, type TutorMessage } from '@/lib/db/schema';
import { askChat, askTutor, generateReview, saveToNotebook, type TutorDeps, type TutorPhase } from '@/lib/tutor/service';
import { threadIds } from '@/lib/tutor/key';
import { geminiErrorMessage } from '@/lib/ai/gemini';

export interface TutorUiState {
  pending: Record<string, TutorPhase>; // threadId → fase
  errors: Record<string, { question: string; message: string }>; // threadId → último erro
  notes: Record<string, string>; // id da mensagem → id da nota criada
}

export const tutorStore = createStore<TutorUiState>({ pending: {}, errors: {}, notes: {} });

// Cópia do objeto sem a chave
function without<T>(o: Record<string, T>, key: string): Record<string, T> {
  const next = { ...o };
  delete next[key];
  return next;
}

export const tutorBusy = (): boolean => Object.keys(tutorStore.get().pending).length > 0;

const setPhase = (t: string, p: TutorPhase | null) => tutorStore.set((s) => ({ pending: p ? { ...s.pending, [t]: p } : without(s.pending, t) }));

// Roda um pedido marcando fase e erro da conversa; ignora se já houver outro em andamento
async function track(t: string, question: string, work: (onPhase: (p: TutorPhase) => void) => Promise<unknown>): Promise<void> {
  if (tutorBusy()) return;
  tutorStore.set((s) => ({ errors: without(s.errors, t) }));
  setPhase(t, 'consulting');
  try {
    await work((p) => setPhase(t, p));
  } catch (e) {
    tutorStore.set((s) => ({ errors: { ...s.errors, [t]: { question, message: geminiErrorMessage(e) } } }));
  } finally {
    setPhase(t, null);
  }
}

// Nova tentativa: tira a pergunta que ficou sem resposta para não duplicá-la
async function dropUnanswered(t: string, question: string): Promise<void> {
  const last = (await db.tutorMessages.where('threadId').equals(t).sortBy('createdAt')).at(-1);
  if (last?.role === 'user' && last.text === question) await db.tutorMessages.delete(last.id);
}

/** Pergunta na conversa da posição; retry não duplica a pergunta. */
export function askInPosition(input: { fen: string; played: AnalyzedMove | null; question: string }, retry = false, deps?: Partial<TutorDeps>): Promise<void> {
  const question = input.question.trim();
  if (!question) return Promise.resolve();
  const t = threadIds.position(input.fen);
  return track(t, question, async (onPhase) => {
    if (retry) await dropUnanswered(t, question);
    await askTutor({ ...input, question }, deps, { onPhase });
  });
}

/** Pergunta numa conversa da página Conversa (fen null = sem posição anexada); retry não duplica a pergunta. */
export function askInChat(input: { chatId: string; fen: string | null; question: string }, retry = false, deps?: Partial<TutorDeps>): Promise<void> {
  const question = input.question.trim();
  if (!question) return Promise.resolve();
  const t = threadIds.chat(input.chatId);
  return track(t, question, async (onPhase) => {
    if (retry) await dropUnanswered(t, question);
    await askChat({ ...input, question }, deps, { onPhase });
  });
}

/** Gera (ou refaz) a revisão da partida analisada. */
export function reviewGame(analysis: GameAnalysis, userColor: 'white' | 'black', deps?: Partial<TutorDeps>): Promise<void> {
  return track(threadIds.review(analysis.id), '', () => generateReview(analysis, userColor, deps));
}

const saving = new Set<string>();

/** Salva a resposta no Caderno uma vez só; devolve o id da nota (null se já estava salvando). */
export async function saveReply(msg: TutorMessage): Promise<string | null> {
  const done = tutorStore.get().notes[msg.id];
  if (done) return done;
  if (saving.has(msg.id)) return null;
  saving.add(msg.id);
  try {
    const id = await saveToNotebook(msg);
    tutorStore.set((s) => ({ notes: { ...s.notes, [msg.id]: id } }));
    return id;
  } finally {
    saving.delete(msg.id);
  }
}

/** Depois de "Apagar dados locais": esquece notas criadas e erros (evita "Abrir nota" para nota apagada). */
export function resetTutorUi(): void {
  tutorStore.set({ errors: {}, notes: {} });
}
