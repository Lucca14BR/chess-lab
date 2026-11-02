import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Menu, Moon, Sun, RefreshCw, CloudOff, Timer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { applyTheme, getTheme, type ThemeMode } from '@/lib/settings';
import { useUserName } from '@/lib/hooks';
import { useStore } from '@/lib/store';
import { syncStore } from '@/lib/chesscom/sync';
import { sessionStore } from '@/lib/services/sessionRunner';
import { GlobalSearch } from './GlobalSearch';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(getTheme());
  useEffect(() => {
    const h = (e: Event) => setMode((e as CustomEvent<ThemeMode>).detail);
    window.addEventListener('chesslab-theme', h);
    return () => window.removeEventListener('chesslab-theme', h);
  }, []);
  return (
    <div className="flex rounded-full border border-line bg-sunken p-0.5" role="radiogroup" aria-label="Tema">
      {(
        [
          ['light', Sun, 'Tema claro'],
          ['dark', Moon, 'Tema escuro'],
        ] as const
      ).map(([m, Icon, label]) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          aria-label={label}
          title={label}
          onClick={() => applyTheme(m)}
          className={cn('flex size-7 items-center justify-center rounded-full transition-colors', mode === m ? 'bg-panel-2 text-brass' : 'text-ink-faint hover:text-ink')}
        >
          <Icon className="size-[15px]" />
        </button>
      ))}
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const account = useLiveQuery(() => db.account.get('chesscom'), []);
  const sync = useStore(syncStore);
  const session = useStore(sessionStore);
  const online = useOnline();
  const name = useUserName();
  const initial = (name || 'C').trim().charAt(0).toUpperCase();

  return (
    <div className="sticky top-0 z-20 border-b border-line bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-5 lg:px-8">
        <button type="button" onClick={onMenu} className="rounded p-1.5 text-ink-muted hover:text-ink lg:hidden" aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
        <GlobalSearch />
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          {!online && (
            <span className="hidden items-center gap-1.5 text-xs text-warning sm:flex" title="Sem conexão: tudo continua funcionando com os seus dados locais.">
              <CloudOff className="size-3.5" /> Offline
            </span>
          )}
          {sync.running && (
            <Link to="/configuracoes" className="hidden items-center gap-1.5 text-xs text-ink-muted hover:text-ink sm:flex" title={sync.step}>
              <RefreshCw className="size-3.5 animate-spin" /> Sincronizando{sync.total ? ` ${sync.done}/${sync.total}` : '…'}
            </Link>
          )}
          {session.running && (
            <Link to="/treino" className="flex items-center gap-1.5 rounded-full border border-positive/40 bg-positive-soft px-2.5 py-1 text-xs text-positive">
              <Timer className="size-3.5" /> {session.paused ? 'Sessão pausada' : 'Sessão em andamento'}
            </Link>
          )}
          <ThemeToggle />
          <Link to="/configuracoes" className="flex items-center gap-2 rounded-full border border-line py-0.5 pr-3 pl-0.5 hover:border-line-strong" title="Conta e configurações">
            {account?.profile.avatar ? (
              <img src={account.profile.avatar} alt="" className="size-7 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="font-display flex size-7 items-center justify-center rounded-full bg-panel-2 text-base text-ink">{initial}</span>
            )}
            <span className="hidden max-w-32 truncate text-xs text-ink-muted sm:inline">{account ? account.displayUsername : 'Conectar Chess.com'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
