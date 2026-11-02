import { useMemo } from 'react';

/** Gerador pseudoaleatório determinístico (para a cena ser sempre a mesma). */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEATHER = ['#4a2418', '#3a2a1b', '#5e4126', '#2c3424', '#3f1f1f', '#6a4c2c', '#272735', '#523018', '#30261a', '#5a3a22'];

interface Book {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  band: boolean;
  lean: number;
}

function shelfBooks(rand: () => number, x0: number, x1: number, baseY: number, maxH: number): Book[] {
  const books: Book[] = [];
  let x = x0;
  while (x < x1 - 8) {
    if (rand() < 0.06) {
      x += 12 + rand() * 20; // espaço vazio
      continue;
    }
    const w = 9 + rand() * 15;
    const h = maxH * (0.72 + rand() * 0.26);
    books.push({ x, y: baseY - h, w, h, c: LEATHER[Math.floor(rand() * LEATHER.length)], band: rand() < 0.7, lean: rand() < 0.04 ? -6 : 0 });
    x += w + 0.6;
  }
  return books;
}

/**
 * Cena panorâmica de biblioteca com peças de xadrez (SVG, sem imagens externas além das peças locais).
 */
export function HeroLibrary() {
  const shelves = useMemo(() => {
    const rand = mulberry32(1871);
    const cases = [
      { x0: 0, x1: 360 },
      { x0: 384, x1: 760 },
      { x0: 784, x1: 1010 },
    ];
    const rows = [70, 160, 250, 340];
    return cases.flatMap((c) => rows.flatMap((y) => shelfBooks(rand, c.x0 + 10, c.x1 - 10, y, 78)));
  }, []);

  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="h-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d140d" />
          <stop offset="1" stopColor="#120b07" />
        </linearGradient>
        <radialGradient id="h-lamp" cx="1215" cy="150" r="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffcf86" stopOpacity=".55" />
          <stop offset=".25" stopColor="#d98d3f" stopOpacity=".22" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4a45" />
          <stop offset=".6" stopColor="#5d5a43" />
          <stop offset="1" stopColor="#7a5c38" />
        </linearGradient>
        <linearGradient id="h-table" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b4426" />
          <stop offset=".08" stopColor="#3d2614" />
          <stop offset="1" stopColor="#1b100a" />
        </linearGradient>
        <linearGradient id="h-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e9b46a" />
          <stop offset=".5" stopColor="#ffe0a8" />
          <stop offset="1" stopColor="#c98a45" />
        </linearGradient>
        <filter id="h-warm" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.92 0 0 0 0.04  0 0.78 0 0 0.02  0 0 0.58 0 0  0 0 0 1 0" />
        </filter>
        <filter id="h-dark" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.55 0 0 0 0.09  0 0.42 0 0 0.05  0 0 0.32 0 0.02  0 0 0 1 0" />
        </filter>
        <filter id="h-blur">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id="h-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <linearGradient id="h-fade-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#120b07" stopOpacity=".96" />
          <stop offset=".38" stopColor="#120b07" stopOpacity=".72" />
          <stop offset=".62" stopColor="#120b07" stopOpacity=".05" />
          <stop offset="1" stopColor="#120b07" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="h-fade-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".7" stopColor="#120b07" stopOpacity="0" />
          <stop offset="1" stopColor="#120b07" stopOpacity=".85" />
        </linearGradient>
      </defs>

      <rect width="1600" height="420" fill="url(#h-wall)" />

      {/* Estantes */}
      <g filter="url(#h-blur)" opacity=".9">
        {[0, 384, 784].map((x, i) => (
          <g key={x}>
            <rect x={x} y="0" width={[360, 376, 226][i]} height="372" fill="#24170e" />
            {[70, 160, 250, 340].map((y) => (
              <rect key={y} x={x} y={y} width={[360, 376, 226][i]} height="9" fill="#4a3019" />
            ))}
            <rect x={x} y="0" width="10" height="372" fill="#3a2514" />
            <rect x={x + [360, 376, 226][i] - 10} y="0" width="10" height="372" fill="#3a2514" />
          </g>
        ))}
        {shelves.map((b, i) => (
          <g key={i} transform={b.lean ? `rotate(${b.lean} ${b.x} ${b.y + b.h})` : undefined}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} />
            <rect x={b.x} y={b.y} width={b.w * 0.25} height={b.h} fill="#fff" opacity=".05" />
            {b.band && (
              <>
                <rect x={b.x + 1} y={b.y + b.h * 0.14} width={b.w - 2} height="2" fill="#b8915a" opacity=".55" />
                <rect x={b.x + 1} y={b.y + b.h * 0.8} width={b.w - 2} height="2" fill="#b8915a" opacity=".45" />
              </>
            )}
          </g>
        ))}
      </g>

      {/* Janela */}
      <g>
        <rect x="1060" y="20" width="250" height="330" fill="url(#h-window)" opacity=".55" />
        <g stroke="#2a1b10" strokeWidth="10" fill="none">
          <rect x="1060" y="20" width="250" height="330" />
          <line x1="1185" y1="20" x2="1185" y2="350" />
          <line x1="1060" y1="130" x2="1310" y2="130" />
          <line x1="1060" y1="240" x2="1310" y2="240" />
        </g>
        <rect x="1340" y="0" width="260" height="372" fill="#1f150d" />
      </g>

      {/* Luz quente da luminária */}
      <rect width="1600" height="420" fill="url(#h-lamp)" />

      {/* Mesa */}
      <rect x="0" y="352" width="1600" height="68" fill="url(#h-table)" />
      <rect x="0" y="352" width="1600" height="2" fill="#a7774a" opacity=".5" />

      {/* Livros empilhados à direita */}
      <g>
        <rect x="1400" y="296" width="190" height="20" fill="#4a2418" />
        <rect x="1408" y="316" width="180" height="18" fill="#2f3324" />
        <rect x="1396" y="334" width="196" height="19" fill="#5a3a22" />
        {[300, 320, 339].map((y) => (
          <rect key={y} x="1400" y={y + 5} width="186" height="1.5" fill="#c9a46b" opacity=".5" />
        ))}
        <rect x="1520" y="160" width="26" height="136" fill="#3f1f1f" />
        <rect x="1548" y="172" width="22" height="124" fill="#523018" />
        <rect x="1572" y="150" width="24" height="146" fill="#2c3424" />
      </g>

      {/* Luminária */}
      <g>
        <rect x="1210" y="210" width="6" height="142" fill="#6a4a2a" />
        <ellipse cx="1213" cy="352" rx="34" ry="6" fill="#3c2814" />
        <path d="M1160 210 L1266 210 L1240 140 L1186 140 Z" fill="url(#h-shade)" />
        <ellipse cx="1213" cy="210" rx="53" ry="6" fill="#ffd89a" opacity=".85" />
      </g>

      {/* Sombras das peças */}
      <ellipse cx="1012" cy="356" rx="80" ry="10" fill="#000" opacity=".55" filter="url(#h-shadow)" />
      <ellipse cx="1300" cy="356" rx="50" ry="8" fill="#000" opacity=".5" filter="url(#h-shadow)" />

      {/* Peças (conjunto Merida, local) */}
      <image href={`${import.meta.env.BASE_URL}pieces/merida/wK.svg`} x="905" y="118" width="214" height="240" filter="url(#h-warm)" preserveAspectRatio="xMidYMax meet" />
      <image href={`${import.meta.env.BASE_URL}pieces/merida/wP.svg`} x="1110" y="262" width="92" height="96" filter="url(#h-warm)" preserveAspectRatio="xMidYMax meet" />
      <image href={`${import.meta.env.BASE_URL}pieces/merida/bN.svg`} x="1250" y="236" width="122" height="122" filter="url(#h-dark)" preserveAspectRatio="xMidYMax meet" />
      <image href={`${import.meta.env.BASE_URL}pieces/merida/bP.svg`} x="1370" y="282" width="72" height="76" filter="url(#h-dark)" preserveAspectRatio="xMidYMax meet" />

      {/* Gradientes para legibilidade do texto */}
      <rect width="1600" height="420" fill="url(#h-fade-left)" />
      <rect width="1600" height="420" fill="url(#h-fade-bottom)" />
    </svg>
  );
}
