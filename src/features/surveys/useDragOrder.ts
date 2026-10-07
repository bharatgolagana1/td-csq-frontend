import { type DragEvent, useState } from 'react';

import { moveIdTo } from './treeOrder';

/* HTML5 drag-and-drop within one sibling group. Keyboard users get the
   move up/down buttons on every row instead (TreeRow). */

export type DragRowProps = {
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLElement>) => void;
  onDragOver?: (e: DragEvent<HTMLElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
  'data-dragging'?: true;
  'data-drop'?: 'before' | 'after';
};

export function useDragOrder(onReorder: (group: string, ids: string[]) => void, enabled: boolean) {
  const [drag, setDrag] = useState<{ group: string; id: string } | null>(null);
  const [over, setOver] = useState<{ id: string; pos: 'before' | 'after' } | null>(null);

  const rowProps = (group: string, ids: readonly string[], id: string): DragRowProps => {
    if (!enabled) return {};
    const sameGroup = drag !== null && drag.group === group && drag.id !== id;
    return {
      draggable: true,
      onDragStart: (e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setDrag({ group, id });
      },
      onDragOver: (e) => {
        if (!sameGroup) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        const r = e.currentTarget.getBoundingClientRect();
        const pos = e.clientY - r.top < r.height / 2 ? 'before' : 'after';
        setOver((o) => (o?.id === id && o.pos === pos ? o : { id, pos }));
      },
      onDragLeave: () => setOver((o) => (o?.id === id ? null : o)),
      onDrop: (e) => {
        if (!sameGroup || !drag) return;
        e.preventDefault();
        e.stopPropagation();
        const without = ids.filter((x) => x !== drag.id);
        const base = without.indexOf(id);
        const index = over?.pos === 'after' ? base + 1 : base;
        onReorder(group, moveIdTo(ids, drag.id, index));
        setDrag(null);
        setOver(null);
      },
      onDragEnd: () => {
        setDrag(null);
        setOver(null);
      },
      ...(drag?.id === id ? { 'data-dragging': true as const } : {}),
      ...(sameGroup && over?.id === id ? { 'data-drop': over.pos } : {}),
    };
  };

  return { rowProps, dragging: drag };
}
