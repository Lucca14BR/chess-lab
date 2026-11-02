import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ConfirmHost, ToastHost } from '@/components/ui/Dialog';
import { LoadingBlock } from '@/components/ui/Feedback';
import { getSettings } from '@/lib/settings';
import { maybeAutoSync } from '@/lib/chesscom/sync';

export function AppLayout() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    void getSettings().then((s) => maybeAutoSync(s.autoSync));
  }, []);

  useEffect(() => {
    document.getElementById('main')?.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-full">
      <a href="#main" className="sr-only z-50 rounded bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Pular para o conteúdo
      </a>
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <div className="lg:pl-[248px]">
        <Topbar onMenu={() => setMenu(true)} />
        <main id="main" tabIndex={-1} className="outline-none">
          <Suspense fallback={<LoadingBlock className="py-24" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
