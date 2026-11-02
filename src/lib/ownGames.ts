// Gravação de partidas próprias: ao editar, preserva o que o Tabuleiro não conhece (origem, cor de quem joga, criação).
import type { OwnGame } from '@/lib/db/schema';

export type OwnGameFields = Pick<OwnGame, 'id' | 'title' | 'pgn' | 'white' | 'black' | 'result'>;

export function ownGameRecord(existing: OwnGame | undefined, fields: OwnGameFields, now: number): OwnGame {
  return { ...existing, ...fields, source: existing?.source ?? 'studio', createdAt: existing?.createdAt ?? now, updatedAt: now };
}
