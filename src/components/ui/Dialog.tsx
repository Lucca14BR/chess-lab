import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { createStore, useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/** Diálogo modal acessível baseado no elemento nativo <dialog>. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: ReactNode; children?: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-xl border border-line-strong bg-panel p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px]',
        size === 'sm' ? 'max-w-md' : size === 'md' ? 'max-w-xl' : 'max-w-3xl',
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-xl">{title}</h2>
              {description && <div className="mt-1 text-sm text-ink-muted">{description}</div>}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar">
              <X />
            </Button>
          </div>
          {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
          {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/* ------------------------- Confirmação global ------------------------- */

interface ConfirmState {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger: boolean;
  resolve: ((v: boolean) => void) | null;
}

const confirmStore = createStore<ConfirmState>({ open: false, title: '', message: '', confirmLabel: 'Confirmar', danger: false, resolve: null });

export function confirm(opts: { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    confirmStore.set({ open: true, title: opts.title, message: opts.message, confirmLabel: opts.confirmLabel ?? 'Confirmar', danger: opts.danger ?? false, resolve });
  });
}

export function ConfirmHost() {
  const s = useStore(confirmStore);
  const close = (v: boolean) => {
    s.resolve?.(v);
    confirmStore.set({ open: false, resolve: null });
  };
  return (
    <Dialog
      open={s.open}
      onClose={() => close(false)}
      title={s.title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button variant={s.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
            {s.confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-ink-muted">{s.message}</div>
    </Dialog>
  );
}

/* ------------------------------ Toasts ------------------------------ */

interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'positive' | 'negative';
}

const toastStore = createStore<{ items: Toast[] }>({ items: [] });
let toastId = 0;

export function toast(text: string, tone: Toast['tone'] = 'info') {
  const id = ++toastId;
  toastStore.set((s) => ({ items: [...s.items, { id, text, tone }] }));
  setTimeout(() => toastStore.set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3800);
}

export function ToastHost() {
  const { items } = useStore(toastStore);
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto max-w-sm rounded-md border bg-panel px-4 py-2.5 text-sm shadow-lg',
            t.tone === 'positive' ? 'border-positive/40' : t.tone === 'negative' ? 'border-negative/40' : 'border-line-strong',
          )}
        >
          <span className={cn('mr-2 inline-block size-1.5 rounded-full align-middle', t.tone === 'positive' ? 'bg-positive' : t.tone === 'negative' ? 'bg-negative' : 'bg-brass')} />
          {t.text}
        </div>
      ))}
    </div>
  );
}
