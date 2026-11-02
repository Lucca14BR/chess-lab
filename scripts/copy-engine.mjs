// Copia o Stockfish (WASM, build "lite single-threaded") para public/stockfish.
import { copyFileSync, mkdirSync } from 'node:fs';

const from = 'node_modules/stockfish';
mkdirSync('public/stockfish', { recursive: true });
for (const f of ['bin/stockfish-19-lite-single.js', 'bin/stockfish-19-lite-single.wasm', 'Copying.txt']) {
  copyFileSync(`${from}/${f}`, `public/stockfish/${f.split('/').pop()}`);
}
console.log('Stockfish copiado para public/stockfish');
