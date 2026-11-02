// Nome de quem usa o Chess Lab: o das Configurações, senão o do Chess.com
import { db, type AccountRow } from '@/lib/db/schema';
import { getSettings } from '@/lib/settings';

/** displayName, senão o primeiro nome do perfil do Chess.com, senão o usuário do Chess.com. */
export function userName(displayName: string | undefined, account: AccountRow | null | undefined): string {
  return displayName?.trim() || account?.profile.name?.trim().split(/\s+/)[0] || account?.displayUsername || '';
}

/** Mesma regra, lida direto da base local (fora do React). */
export async function getUserName(): Promise<string> {
  const [{ displayName }, account] = await Promise.all([getSettings(), db.account.get('chesscom')]);
  return userName(displayName, account);
}
