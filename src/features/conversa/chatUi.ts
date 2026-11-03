// Estado da página Conversa fora do componente: conversa aberta e "anexar posição" sobrevivem à troca de página.
// O pedido em andamento e o erro de cada conversa ficam no tutorStore (um pedido por vez no app todo).
import { createStore } from '@/lib/store';
import { uid } from '@/lib/utils';

export interface ChatUiState {
  /** Conversa aberta; null = a mais recente (ou uma nova, se não houver nenhuma). Um id sem linha no banco = conversa nova ainda vazia. */
  selected: string | null;
  /** Anexar a posição do tabuleiro a cada pergunta. */
  attach: boolean;
}

export const chatUi = createStore<ChatUiState>({ selected: null, attach: true });

export const selectChat = (id: string | null) => chatUi.set({ selected: id });

/** Abre uma conversa nova (ela só é salva na primeira pergunta). */
export function newChat(): string {
  const id = uid();
  selectChat(id);
  return id;
}

export const setAttach = (attach: boolean) => chatUi.set({ attach });
