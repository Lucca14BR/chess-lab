import { db, type ActivityKind } from '@/lib/db/schema';
import { uid } from '@/lib/utils';
import { sessionStore } from '@/lib/services/sessionRunner';

export async function logActivity(entry: {
  kind: ActivityKind;
  title: string;
  detail?: string;
  durationMs?: number;
  link?: string | null;
}) {
  await db.activity.add({
    id: uid(),
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail ?? '',
    date: Date.now(),
    durationMs: entry.durationMs ?? 0,
    inSession: sessionStore.get().running,
    link: entry.link ?? null,
  });
}
