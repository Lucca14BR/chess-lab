import type { ReactNode } from 'react';
import type { MoveTree, TreeNode } from '@/lib/chess/tree';
import { cn } from '@/lib/utils';

/** Exibe a árvore de variantes: a continuação principal em linha, alternativas recuadas. */
export function MoveTreeView({ tree, current, onSelect }: { tree: MoveTree; current: string[]; onSelect: (path: string[]) => void }) {
  const whiteFirst = tree.rootFen.split(' ')[1] === 'w';
  const startNo = Number(tree.rootFen.split(' ')[5]) || 1;
  const curKey = current.join(' ');

  const label = (n: TreeNode, showNumber: boolean) => {
    const ply = n.path.length - 1 + (whiteFirst ? 0 : 1);
    const no = startNo + Math.floor(ply / 2);
    const white = ply % 2 === 0;
    return (
      <>
        {(white || showNumber) && <span className="text-ink-faint">{white ? `${no}.` : `${no}...`}</span>}
        {n.san}
      </>
    );
  };

  const seq = (nodes: TreeNode[], showNumber: boolean, depth: number): ReactNode => {
    if (!nodes.length) return null;
    const [main, ...alts] = nodes;
    const active = main.path.join(' ') === curKey;
    const onPath = curKey.startsWith(main.path.join(' ') + ' ');
    return (
      <>
        <button type="button" onClick={() => onSelect(main.path)} className={cn('mr-1 inline-flex gap-1 rounded px-1 py-0.5 font-mono text-[13px]', active ? 'bg-accent-soft text-ink ring-1 ring-brass/50' : onPath ? 'text-ink' : 'text-ink-muted hover:bg-hover hover:text-ink')}>
          {label(main, showNumber)}
        </button>
        {main.labels.length > 0 && <span className="mr-1 text-[11px] text-brass italic">{main.labels.join(' · ')}</span>}
        {alts.length > 0 && (
          <div className={cn('my-1 space-y-1 border-l border-line pl-3', depth > 4 && 'pl-2')}>
            {alts.map((alt) => (
              <div key={alt.san} className="leading-7">
                {seq([alt], true, depth + 1)}
              </div>
            ))}
          </div>
        )}
        {seq(main.children, alts.length > 0, depth)}
      </>
    );
  };

  if (!tree.children.length) return <p className="text-xs text-ink-faint">Nenhum lance na árvore.</p>;
  return (
    <div className="leading-7">
      <button type="button" onClick={() => onSelect([])} className={cn('mr-1 rounded px-1 py-0.5 text-[12px]', current.length === 0 ? 'bg-accent-soft text-ink' : 'text-ink-faint hover:text-ink')}>
        Início
      </button>
      {seq(tree.children, true, 0)}
    </div>
  );
}
