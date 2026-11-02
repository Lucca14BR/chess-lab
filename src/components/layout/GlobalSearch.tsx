import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { searchAll, type SearchResult } from '@/lib/search';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      searchAll(q).then((r) => {
        if (alive) {
          setResults(r);
          setActive(0);
        }
      });
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const go = (r: SearchResult) => {
    navigate(r.to);
    setOpen(false);
    setQ('');
    input.current?.blur();
  };

  const groups = [...new Set(results.map((r) => r.group))];

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
      <input
        ref={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && results[active]) {
            go(results[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
            input.current?.blur();
          }
        }}
        placeholder="Pesquisar no Chess Lab…"
        aria-label="Pesquisar no Chess Lab"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="search-results"
        className="h-9 w-full rounded-md border border-line bg-sunken/70 pr-14 pl-9 text-sm text-ink placeholder:text-ink-faint hover:border-line-strong focus:border-brass focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[10px] text-ink-faint sm:block">Ctrl K</kbd>
      {open && q.trim().length >= 2 && (
        <div id="search-results" role="listbox" className="absolute top-11 right-0 left-0 z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-line-strong bg-panel p-1.5 shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-ink-muted">Nada encontrado para “{q}”.</p>
          ) : (
            groups.map((g) => (
              <div key={g} className="mb-1">
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.16em] text-ink-faint uppercase">{g}</p>
                {results
                  .map((r, i) => ({ r, i }))
                  .filter(({ r }) => r.group === g)
                  .map(({ r, i }) => (
                    <button
                      key={`${r.to}-${i}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(r)}
                      onMouseEnter={() => setActive(i)}
                      className={cn('block w-full rounded-md px-2.5 py-1.5 text-left', i === active ? 'bg-hover' : '')}
                    >
                      <span className="block truncate text-sm text-ink">{r.title}</span>
                      {r.subtitle && <span className="block truncate text-xs text-ink-muted">{r.subtitle}</span>}
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
