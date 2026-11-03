import { BookmarkPlus, NotebookPen, Paperclip } from 'lucide-react';
import type { TutorMessage } from '@/lib/db/schema';
import type { Segment } from '@/lib/tutor/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SourceTag } from '@/components/ui/Badge';
import { TutorText, type UnverifiedNotice } from '@/features/board/tutor/TutorText';
import { fenSummary } from './position';

type MoveSegment = Extract<Segment, { kind: 'move' }>;

// Nesta página, conselhos gerais com lances são normais: o aviso diz só que o motor não conferiu o lance
const NOTICE_WITH_POSITION: UnverifiedNotice = {
  label: 'não conferido na posição atual',
  title: 'O motor não conferiu este lance na posição anexada. Pode ser um conselho geral (de abertura, por exemplo) ou um lance que não vale aqui.',
};
const NOTICE_WITHOUT_POSITION: UnverifiedNotice = {
  label: 'não conferido no tabuleiro',
  title: 'A pergunta foi sem posição anexada: o motor não conferiu nenhum lance desta resposta.',
};

/** Pergunta: texto e, se a posição foi junto, o selo "Posição anexada" (clique leva a posição ao tabuleiro). */
export function UserMessage({ msg, onLoadFen }: { msg: TutorMessage; onLoadFen: (fen: string) => void }) {
  return (
    <div className="ml-8 flex flex-col items-end gap-1">
      <p className="rounded-md bg-hover px-3 py-2 text-sm whitespace-pre-line text-ink">{msg.text}</p>
      {msg.fen && (
        <button
          type="button"
          onClick={() => onLoadFen(msg.fen!)}
          className="inline-flex max-w-full items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[10.5px] text-ink-faint hover:border-line-strong hover:text-ink-muted"
          title={`Carregar no tabuleiro: ${msg.fen}`}
        >
          <Paperclip className="size-3 shrink-0" />
          <span className="shrink-0">Posição anexada</span>
          <span className="truncate font-mono">· {fenSummary(msg.fen)}</span>
        </button>
      )}
    </div>
  );
}

/** Resposta do tutor: lances conferidos viram botões, modelo, etiqueta "IA" e "Salvar no Caderno". */
export function TutorReply({ msg, noteId, onMove, onSave }: { msg: TutorMessage; noteId: string | undefined; onMove: (s: MoveSegment) => void; onSave: () => void }) {
  return (
    <div className="mr-4 rounded-md border border-line bg-sunken px-3 py-2.5">
      <TutorText className="text-sm" segments={msg.segments ?? [{ kind: 'text', text: msg.text }]} onMove={onMove} notice={msg.fen ? NOTICE_WITH_POSITION : NOTICE_WITHOUT_POSITION} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SourceTag source="ai" />
        {msg.model && <span className="font-mono text-[10.5px] text-ink-faint">{msg.model}</span>}
        <span className="ml-auto">
          {noteId ? (
            <ButtonLink size="sm" variant="ghost" to={`/caderno?nota=${noteId}`}>
              <NotebookPen /> Abrir nota
            </ButtonLink>
          ) : (
            <Button size="sm" variant="ghost" onClick={onSave}>
              <BookmarkPlus /> Salvar no Caderno
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}
