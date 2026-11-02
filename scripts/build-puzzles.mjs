// Gera public/data/puzzles.json a partir da base pública de puzzles da Lichess (licença CC0).
// Faz streaming do arquivo .csv.zst e interrompe o download assim que todas as cotas são preenchidas.
// Uso: node scripts/build-puzzles.mjs [porCategoriaENivel=45]
import { createZstdDecompress } from 'node:zlib';
import { Readable } from 'node:stream';
import { createInterface } from 'node:readline';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { Chess } from 'chess.js';

const SOURCE = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';
const PER_BUCKET = Number(process.argv[2] ?? 45);

// Categoria do Chess Lab -> temas Lichess que a qualificam
const CATEGORIES = {
  garfo: ['fork'],
  cravada: ['pin'],
  ataqueDescoberto: ['discoveredAttack'],
  espeto: ['skewer'],
  desvio: ['deflection'],
  ataqueDuplo: ['doubleCheck'],
  sacrificio: ['sacrifice'],
  xequeMate: ['mate'],
  combinacao: ['long', 'veryLong'],
  defesa: ['defensiveMove'],
  pecaSolta: ['hangingPiece'],
  pecaPresa: ['trappedPiece'],
  mateEm1: ['mateIn1'],
  mateEm2: ['mateIn2'],
  mateCorredor: ['backRankMate'],
  removerDefensor: ['capturingDefender'],
  atracao: ['attraction'],
  finais: ['endgame'],
  promocao: ['promotion'],
};

const LEVELS = [
  { id: 'iniciante', min: 600, max: 1300 },
  { id: 'intermediario', min: 1300, max: 1900 },
  { id: 'avancado', min: 1900, max: 2700 },
];

const buckets = new Map();
for (const c of Object.keys(CATEGORIES)) for (const l of LEVELS) buckets.set(`${c}|${l.id}`, []);
const full = () => [...buckets.values()].every((b) => b.length >= PER_BUCKET);

// Mantém os puzzles já publicados (o histórico de tentativas aponta para eles) e só completa as cotas que faltam.
const known = new Set();
const OUT = 'public/data/puzzles.json';
if (existsSync(OUT)) {
  for (const p of JSON.parse(readFileSync(OUT, 'utf8')).puzzles) {
    const b = buckets.get(`${p.category}|${p.level}`);
    if (b && b.length < PER_BUCKET) {
      b.push(p);
      known.add(p.id);
    }
  }
  console.log(`Mantidos ${known.size} puzzles existentes.`);
}

function validate(fen, moves) {
  try {
    const chess = new Chess(fen);
    for (const uci of moves) {
      const m = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      if (!m) return false;
    }
    return true;
  } catch {
    return false;
  }
}

const controller = new AbortController();
// O arquivo começa com um frame "skippable" (formato seekable) de 12 bytes que o zlib do Node rejeita.
const res = await fetch(SOURCE, { signal: controller.signal, headers: { Range: 'bytes=12-', 'User-Agent': 'ChessLab-build/0.1 (personal project)' } });
if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
const stream = Readable.fromWeb(res.body).pipe(createZstdDecompress());
const rl = createInterface({ input: stream, crlfDelay: Infinity });

let lines = 0;
let header = true;
for await (const line of rl) {
  if (header) { header = false; continue; }
  lines++;
  const [id, fen, movesStr, rating, rd, popularity, plays, themesStr, gameUrl] = line.split(',');
  const r = Number(rating);
  if (Number(popularity) < 85 || Number(plays) < 300 || Number(rd) > 80) continue;
  const level = LEVELS.find((l) => r >= l.min && r < l.max);
  if (!level || known.has(id)) continue;
  const themes = themesStr.split(' ');
  const candidates = Object.entries(CATEGORIES)
    .filter(([, tags]) => tags.some((t) => themes.includes(t)))
    .map(([c]) => buckets.get(`${c}|${level.id}`))
    .filter((b) => b.length < PER_BUCKET)
    .sort((a, b) => a.length - b.length);
  if (!candidates.length) continue;
  const moves = movesStr.split(' ');
  if (!validate(fen, moves)) continue;
  const category = [...buckets.entries()].find(([, b]) => b === candidates[0])[0].split('|')[0];
  candidates[0].push({ id, fen, moves, rating: r, themes, category, level: level.id, gameUrl });
  if (full()) break;
}
controller.abort();
stream.destroy();

const puzzles = [...buckets.values()].flat();
mkdirSync('public/data', { recursive: true });
writeFileSync(
  'public/data/puzzles.json',
  JSON.stringify({
    source: 'Lichess puzzle database (https://database.lichess.org/#puzzles)',
    license: 'CC0 1.0',
    generatedAt: new Date().toISOString(),
    count: puzzles.length,
    puzzles,
  }),
);
console.log(`Lidas ${lines} linhas; ${puzzles.length} puzzles gravados.`);
for (const [k, b] of buckets) if (b.length < PER_BUCKET) console.log(`Cota incompleta: ${k} = ${b.length}`);
process.exit(0);
