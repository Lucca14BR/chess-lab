import { Link } from 'react-router';

/** Marca: cavalo com louros, em traço fino. */
export function Logo() {
  return (
    <Link to="/" className="flex flex-col items-center text-center" aria-label="Chess Lab — Painel Inicial">
      <svg viewBox="0 0 96 72" className="h-14 w-auto text-brass" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* louros */}
          <path d="M22 62c-9-6-13-16-11-28" />
          <path d="M74 62c9-6 13-16 11-28" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <path d={`M${13 + i * 1.6} ${36 + i * 5.4}c-4-1-6-4-6-7 3 0 6 2 6 7z`} fill="currentColor" fillOpacity=".25" />
              <path d={`M${83 - i * 1.6} ${36 + i * 5.4}c4-1 6-4 6-7-3 0-6 2-6 7z`} fill="currentColor" fillOpacity=".25" />
            </g>
          ))}
          {/* cavalo */}
          <path d="M36 62h24M38 57h20l-2-6H40z" />
          <path d="M41 51c-1-7 2-12 7-16l-6-1c-3 0-5-2-5-4l9-9 1-6 4 4c8 2 12 9 12 17 0 6-2 11-5 15" fill="currentColor" fillOpacity=".12" />
          <circle cx="47.5" cy="24.5" r="1" fill="currentColor" />
        </g>
      </svg>
      <span className="font-display mt-2 text-[26px] leading-none tracking-[0.08em] text-ink">CHESS LAB</span>
      <span className="mt-1.5 text-[10px] font-medium tracking-[0.28em] text-ink-muted uppercase">A arte de evoluir</span>
    </Link>
  );
}
