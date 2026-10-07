import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { sameSelection, type Selection, selectionFromParam, selectionToParam } from './editorContext';
import { type OrderSpec } from './treeOrder';

/* The editor page's own state: which node is open (mirrored to `?node=` for
   deep links), whether its form is dirty (a ref: it only gates selection
   changes and never needs a render), the selection waiting behind a discard
   prompt, and the pending reorder. */

export type EditorState = {
  selected: Selection | null;
  select: (next: Selection | null, force?: boolean) => void;
  clearSelection: () => void;
  setDirty: (dirty: boolean) => void;
  /** A selection the user asked for while a form was dirty; `undefined` when nothing is pending. */
  pending: Selection | null | undefined;
  keepEditing: () => void;
  discardAndSelect: () => void;
  spec: OrderSpec;
  reorder: (group: string, ids: string[]) => void;
  resetOrder: () => void;
};

export function useEditorState(): EditorState {
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<Selection | null>(() => selectionFromParam(params.get('node')));
  const [pending, setPending] = useState<Selection | null | undefined>(undefined);
  const [spec, setSpec] = useState<OrderSpec>({});
  const dirtyRef = useRef(false);
  const selectedRef = useRef(selected);

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const apply = useCallback(
    (next: Selection | null) => {
      dirtyRef.current = false;
      selectedRef.current = next;
      setSelected(next);
      setParams(
        (prev) => {
          const q = new URLSearchParams(prev);
          const value = selectionToParam(next);
          if (value) q.set('node', value);
          else q.delete('node');
          return q;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const select = useCallback(
    (next: Selection | null, force = false) => {
      if (sameSelection(next, selectedRef.current)) return;
      if (dirtyRef.current && !force) {
        setPending(next);
        return;
      }
      apply(next);
    },
    [apply],
  );

  const clearSelection = useCallback(() => apply(null), [apply]);
  const keepEditing = useCallback(() => setPending(undefined), []);
  const discardAndSelect = useCallback(() => {
    if (pending !== undefined) apply(pending);
    setPending(undefined);
  }, [pending, apply]);

  const reorder = useCallback((group: string, ids: string[]) => setSpec((s) => ({ ...s, [group]: ids })), []);
  const resetOrder = useCallback(() => setSpec({}), []);

  return { selected, select, clearSelection, setDirty, pending, keepEditing, discardAndSelect, spec, reorder, resetOrder };
}
