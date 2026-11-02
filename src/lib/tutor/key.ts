// Chave do Gemini (guardada só neste navegador, fora do backup) e ids de conversa
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { positionKey } from '@/lib/chess/board'

const KEY = 'geminiKey'

export async function getGeminiKey(): Promise<string | null> {
  return (await db.secrets.get(KEY))?.value ?? null
}

// Vazio = remove
export async function setGeminiKey(raw: string): Promise<void> {
  const value = raw.trim()
  if (!value) return removeGeminiKey()
  await db.secrets.put({ key: KEY, value })
}

export async function removeGeminiKey(): Promise<void> {
  await db.secrets.delete(KEY)
}

// undefined enquanto carrega
export function useHasGeminiKey(): boolean | undefined {
  return useLiveQuery(async () => (await db.secrets.get(KEY)) !== undefined, [])
}

export const threadIds = {
  review: (analysisId: string) => `review:${analysisId}`,
  position: (fen: string) => `pos:${positionKey(fen)}`,
}
