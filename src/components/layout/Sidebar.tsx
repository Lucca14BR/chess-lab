import { NavLink } from 'react-router';
import { Home, ChessKnight, Swords, MessagesSquare, Puzzle, GraduationCap, BookOpenText, ChartLine, NotebookPen, Dumbbell, Settings, X } from 'lucide-react';
import { useUserName } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

export const NAV = [
  {
    group: 'Workspace',
    items: [
      { to: '/', label: 'Painel Inicial', icon: Home, end: true },
      { to: '/tabuleiro', label: 'Tabuleiro', icon: ChessKnight },
      { to: '/jogar', label: 'Jogar', icon: Swords },
      { to: '/conversa', label: 'Conversa', icon: MessagesSquare },
      { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
      { to: '/academia', label: 'Academia', icon: GraduationCap },
    ],
  },
  {
    group: 'Aprendizado',
    items: [
      { to: '/aberturas', label: 'Aberturas', icon: BookOpenText },
      { to: '/desempenho', label: 'Desempenho', icon: ChartLine },
      { to: '/caderno', label: 'Caderno de Estudos', icon: NotebookPen },
      { to: '/treino', label: 'Centro de Treino', icon: Dumbbell },
    ],
  },
  {
    group: 'Sistema',
    items: [{ to: '/configuracoes', label: 'Configurações', icon: Settings }],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const name = useUserName();
  return (
    <>
      <div className={cn('fixed inset-0 z-30 bg-black/50 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} aria-hidden />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-[color-mix(in_srgb,var(--bg-panel)_88%,transparent)] backdrop-blur-sm transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navegação principal"
      >
        <div className="relative px-6 pt-7 pb-6">
          <Logo />
          <button type="button" onClick={onClose} className="absolute top-4 right-3 rounded p-1 text-ink-muted hover:text-ink lg:hidden" aria-label="Fechar menu">
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((section, si) => (
            <div key={section.group} className={cn(si > 0 && 'mt-4 border-t border-line pt-4')}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.2em] text-ink-faint uppercase">{section.group}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors',
                          isActive ? 'bg-accent-soft text-ink' : 'text-ink-muted hover:bg-hover hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r bg-brass" />}
                          <item.icon className={cn('size-[18px] shrink-0', isActive ? 'text-brass' : 'text-ink-faint group-hover:text-ink-muted')} strokeWidth={1.6} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-line px-6 py-4 text-center">
          {name && <p className="font-display mb-1 truncate text-[16px] text-ink">A biblioteca de {name}</p>}
          <p className="font-display text-[15px] text-ink-muted italic">“Pense. Estude. Evolua.”</p>
          <p className="mt-2 text-[10px] leading-snug text-ink-faint">Aplicativo independente, sem afiliação com o Chess.com.</p>
        </div>
      </aside>
    </>
  );
}
