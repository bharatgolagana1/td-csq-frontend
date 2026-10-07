import { createContext, useContext } from 'react';

import { type Category, type Survey } from '@/api/surveys.types';

/* Feature-local context so the tree, rows and node forms never drill props past
   two levels (ARCHITECTURE §1a). The page owns the state; this is read-only. */

export type Selection =
  | { kind: 'category'; id: string }
  | { kind: 'subcategory'; id: string }
  | { kind: 'question'; id: string }
  | { kind: 'new-category' }
  | { kind: 'new-subcategory'; categoryId: string }
  | { kind: 'new-question'; categoryId: string; subcategoryId: string | null };

export type EditorContextValue = {
  surveyId: string;
  survey: Survey;
  /** The tree as displayed (server order with any pending reorder applied). */
  categories: Category[];
  /** Published/retired versions, or a viewer without `surveys.manage`. */
  readOnly: boolean;
  selected: Selection | null;
  /** Asks to change the selection; the page confirms first when a form is dirty unless `force` is set. */
  select: (next: Selection | null, force?: boolean) => void;
  /** Node forms report their dirty state so the page can guard selection changes. */
  setDirty: (dirty: boolean) => void;
  /** Replace the id order of one sibling group (see treeOrder.ts). */
  reorder: (group: string, ids: string[]) => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider = EditorContext.Provider;

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>');
  return ctx;
}

export function isSelected(selected: Selection | null, kind: 'category' | 'subcategory' | 'question', id: string): boolean {
  return selected?.kind === kind && selected.id === id;
}

export function sameSelection(a: Selection | null, b: Selection | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.kind !== b.kind) return false;
  if ('id' in a && 'id' in b) return a.id === b.id;
  if (a.kind === 'new-subcategory' && b.kind === 'new-subcategory') return a.categoryId === b.categoryId;
  if (a.kind === 'new-question' && b.kind === 'new-question') return a.categoryId === b.categoryId && a.subcategoryId === b.subcategoryId;
  return a.kind === 'new-category';
}

/** `?node=question:<id>` ↔ Selection, for deep links and reloads. */
export function selectionToParam(s: Selection | null): string | null {
  if (!s || !('id' in s)) return null;
  return `${s.kind}:${s.id}`;
}

export function selectionFromParam(value: string | null): Selection | null {
  if (!value) return null;
  const [kind, id] = value.split(':');
  if (!id) return null;
  if (kind === 'category' || kind === 'subcategory' || kind === 'question') return { kind, id };
  return null;
}
