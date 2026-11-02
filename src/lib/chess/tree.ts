// Árvore de variantes construída a partir de linhas SAN (repertórios e aberturas).
import { Chess } from 'chess.js';

export interface TreeNode {
  san: string;
  fen: string; // posição após o lance
  from: string;
  to: string;
  path: string[]; // lances desde o início, incluindo este
  children: TreeNode[];
  /** Nomes/comentários das linhas que passam por este lance e terminam nele. */
  labels: string[];
}

export interface MoveTree {
  rootFen: string;
  children: TreeNode[];
}

export function buildTree(lines: Array<{ moves: string[]; label?: string }>, rootFen?: string): MoveTree {
  const start = rootFen ?? new Chess().fen();
  const tree: MoveTree = { rootFen: start, children: [] };
  for (const line of lines) {
    const c = new Chess(start);
    let level = tree.children;
    const path: string[] = [];
    let last: TreeNode | null = null;
    for (const san of line.moves) {
      let m;
      try {
        m = c.move(san);
      } catch {
        break;
      }
      path.push(m.san);
      let node = level.find((n) => n.san === m.san);
      if (!node) {
        node = { san: m.san, fen: c.fen(), from: m.from, to: m.to, path: [...path], children: [], labels: [] };
        level.push(node);
      }
      last = node;
      level = node.children;
    }
    if (last && line.label && !last.labels.includes(line.label)) last.labels.push(line.label);
  }
  return tree;
}

export function findNode(tree: MoveTree, path: string[]): TreeNode | null {
  let level = tree.children;
  let node: TreeNode | null = null;
  for (const san of path) {
    node = level.find((n) => n.san === san) ?? null;
    if (!node) return null;
    level = node.children;
  }
  return node;
}

export function countLeaves(nodes: TreeNode[]): number {
  return nodes.reduce((s, n) => s + (n.children.length ? countLeaves(n.children) : 1), 0);
}

/** Serializa a árvore em PGN com variações entre parênteses. */
export function treeToPgn(tree: MoveTree, headers: Record<string, string> = {}): string {
  const startNo = Number(tree.rootFen.split(' ')[5]) || 1;
  const whiteFirst = tree.rootFen.split(' ')[1] === 'w';
  const num = (ply: number) => {
    const p = ply + (whiteFirst ? 0 : 1);
    return { no: startNo + Math.floor(p / 2), white: p % 2 === 0 };
  };
  const writeSeq = (nodes: TreeNode[], ply: number, forceNumber: boolean): string => {
    if (!nodes.length) return '';
    const [main, ...alts] = nodes;
    const { no, white } = num(ply);
    let out = white ? `${no}. ${main.san}` : forceNumber ? `${no}... ${main.san}` : main.san;
    for (const alt of alts) {
      out += ` (${white ? `${no}. ` : `${no}... `}${alt.san}${alt.children.length ? ' ' + writeSeq(alt.children, ply + 1, false) : ''})`;
    }
    if (main.children.length) out += ' ' + writeSeq(main.children, ply + 1, alts.length > 0);
    return out;
  };
  const head = Object.entries({ Event: 'Chess Lab — Repertório', Result: '*', ...headers })
    .map(([k, v]) => `[${k} "${v.replace(/"/g, '\\"')}"]`)
    .join('\n');
  return `${head}\n\n${writeSeq(tree.children, 0, true)} *\n`;
}
