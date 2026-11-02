// Parser/serializador PGN próprio: suporta cabeçalhos, comentários, NAGs, variações e múltiplas partidas.
import { Chess } from 'chess.js';

export interface PgnMove {
  san: string;
  comment: string;
  nags: number[];
  variations: PgnMove[][];
}

export interface PgnGame {
  headers: Record<string, string>;
  startComment: string;
  moves: PgnMove[];
  result: string;
}

const RESULT_TOKENS = new Set(['1-0', '0-1', '1/2-1/2', '*']);
const SUFFIX_NAG: Record<string, number> = { '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6 };

type Token =
  | { t: 'comment'; v: string }
  | { t: 'open' }
  | { t: 'close' }
  | { t: 'nag'; v: number }
  | { t: 'san'; v: string }
  | { t: 'result'; v: string };

function tokenize(movetext: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const s = movetext;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === '{') {
      const end = s.indexOf('}', i + 1);
      const stop = end === -1 ? s.length : end;
      out.push({ t: 'comment', v: s.slice(i + 1, stop) });
      i = stop + 1;
    } else if (c === ';') {
      const end = s.indexOf('\n', i);
      const stop = end === -1 ? s.length : end;
      out.push({ t: 'comment', v: s.slice(i + 1, stop) });
      i = stop + 1;
    } else if (c === '(') {
      out.push({ t: 'open' });
      i++;
    } else if (c === ')') {
      out.push({ t: 'close' });
      i++;
    } else if (c === '$') {
      const m = s.slice(i).match(/^\$(\d+)/);
      if (m) {
        out.push({ t: 'nag', v: Number(m[1]) });
        i += m[0].length;
      } else i++;
    } else {
      const m = s.slice(i).match(/^[^\s{}();]+/);
      const word = m ? m[0] : c;
      i += word.length;
      if (RESULT_TOKENS.has(word)) {
        out.push({ t: 'result', v: word });
        continue;
      }
      // remove números de lance ("12." / "12..." / "12...e5")
      const stripped = word.replace(/^\d+\.(\.\.)?/, '').replace(/^\.+/, '');
      if (!stripped) continue;
      const sm = stripped.match(/^(.*?)([!?]{1,2})$/);
      if (sm && sm[1]) {
        out.push({ t: 'san', v: sm[1] });
        out.push({ t: 'nag', v: SUFFIX_NAG[sm[2]] ?? 0 });
      } else out.push({ t: 'san', v: stripped });
    }
  }
  return out;
}

function parseMoves(tokens: Token[], pos: { i: number }): { moves: PgnMove[]; result: string; lead: string } {
  const moves: PgnMove[] = [];
  let result = '*';
  let lead = '';
  while (pos.i < tokens.length) {
    const tk = tokens[pos.i];
    if (tk.t === 'close') {
      pos.i++;
      break;
    }
    pos.i++;
    if (tk.t === 'san') {
      moves.push({ san: tk.v, comment: '', nags: [], variations: [] });
    } else if (tk.t === 'comment') {
      const last = moves[moves.length - 1];
      const text = tk.v.trim();
      if (last) last.comment = last.comment ? `${last.comment} ${text}` : text;
      else lead = lead ? `${lead} ${text}` : text;
    } else if (tk.t === 'nag') {
      moves[moves.length - 1]?.nags.push(tk.v);
    } else if (tk.t === 'open') {
      const sub = parseMoves(tokens, pos);
      const last = moves[moves.length - 1];
      if (last && sub.moves.length) {
        if (sub.lead) sub.moves[0].comment = sub.moves[0].comment ? `${sub.lead} ${sub.moves[0].comment}` : sub.lead;
        last.variations.push(sub.moves);
      }
    } else if (tk.t === 'result') {
      result = tk.v;
    }
  }
  return { moves, result, lead };
}

export function parsePgn(text: string): PgnGame {
  const headers: Record<string, string> = {};
  const headerRe = /^\s*\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/;
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const body: string[] = [];
  for (const line of lines) {
    const m = line.match(headerRe);
    if (m && body.every((b) => !b.trim())) headers[m[1]] = m[2].replace(/\\"/g, '"');
    else body.push(line);
  }
  const tokens = tokenize(body.join('\n'));
  const parsed = parseMoves(tokens, { i: 0 });
  return { headers, startComment: parsed.lead, moves: parsed.moves, result: parsed.result !== '*' ? parsed.result : headers.Result ?? '*' };
}

/** Divide um arquivo com várias partidas. */
export function splitPgn(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const games: string[] = [];
  let cur: string[] = [];
  let inMoves = false;
  for (const line of lines) {
    const isHeader = /^\s*\[\w+\s+".*"\]\s*$/.test(line);
    if (isHeader && inMoves) {
      games.push(cur.join('\n').trim());
      cur = [];
      inMoves = false;
    }
    if (!isHeader && line.trim()) inMoves = true;
    cur.push(line);
  }
  if (cur.join('').trim()) games.push(cur.join('\n').trim());
  return games.filter(Boolean);
}

/** Remove anotações de máquina dos comentários: [%clk ...], [%eval ...], etc. */
export function cleanComment(c: string): string {
  return c.replace(/\[%[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
}

export interface ReplayedMove {
  san: string;
  uci: string;
  from: string;
  to: string;
  fen: string;
  color: 'w' | 'b';
  comment: string;
}

/** Reproduz a linha principal com chess.js, validando cada lance. */
export function replayMainline(game: PgnGame): { startFen: string; moves: ReplayedMove[]; error: string | null } {
  const startFen = game.headers.SetUp === '1' || game.headers.FEN ? game.headers.FEN ?? new Chess().fen() : new Chess().fen();
  let chess: Chess;
  try {
    chess = new Chess(startFen);
  } catch {
    return { startFen: new Chess().fen(), moves: [], error: 'FEN inicial inválida no PGN.' };
  }
  const moves: ReplayedMove[] = [];
  for (const m of game.moves) {
    try {
      const mv = chess.move(m.san);
      moves.push({ san: mv.san, uci: mv.from + mv.to + (mv.promotion ?? ''), from: mv.from, to: mv.to, fen: chess.fen(), color: mv.color, comment: cleanComment(m.comment) });
    } catch {
      return { startFen, moves, error: `Lance inválido no PGN: "${m.san}" (lance ${Math.floor(moves.length / 2) + 1}).` };
    }
  }
  return { startFen, moves, error: null };
}

/** Converte a árvore (com variações) em linhas SAN completas a partir do início. */
export function flattenLines(moves: PgnMove[], prefix: string[] = []): string[][] {
  const lines: string[][] = [];
  const main = [...prefix];
  moves.forEach((m, idx) => {
    for (const v of m.variations) lines.push(...flattenLines(v, [...main]));
    main.push(m.san);
    if (idx === moves.length - 1) lines.push(main);
  });
  if (!moves.length && prefix.length) lines.push(prefix);
  return lines;
}

const escapeHeader = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const escapeComment = (v: string) => v.replace(/[{}]/g, '');

export function buildPgn(opts: { headers?: Record<string, string>; startFen?: string; moves: Array<{ san: string; comment?: string }>; result?: string }): string {
  const start = opts.startFen && opts.startFen !== new Chess().fen() ? opts.startFen : undefined;
  const result = opts.result ?? '*';
  const headers: Record<string, string> = {
    Event: 'Chess Lab',
    Site: 'Chess Lab',
    Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    White: '?',
    Black: '?',
    Result: result,
    ...opts.headers,
  };
  if (start) {
    headers.SetUp = '1';
    headers.FEN = start;
  }
  const head = Object.entries(headers)
    .map(([k, v]) => `[${k} "${escapeHeader(v)}"]`)
    .join('\n');
  const startColor = start ? start.split(' ')[1] : 'w';
  let moveNo = start ? Number(start.split(' ')[5]) || 1 : 1;
  const parts: string[] = [];
  opts.moves.forEach((m, i) => {
    const white = (i % 2 === 0) === (startColor === 'w');
    if (white) parts.push(`${moveNo}.`);
    else if (i === 0) parts.push(`${moveNo}...`);
    parts.push(m.san);
    if (m.comment?.trim()) parts.push(`{${escapeComment(m.comment.trim())}}`);
    if (!white) moveNo++;
    else if (m.comment?.trim() && i < opts.moves.length - 1) parts.push(`${moveNo}...`);
  });
  parts.push(result);
  // quebra de linha a cada ~80 caracteres
  const lines: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).trim().length > 80) {
      lines.push(cur.trim());
      cur = p;
    } else cur += ' ' + p;
  }
  if (cur.trim()) lines.push(cur.trim());
  return `${head}\n\n${lines.join('\n')}\n`;
}
