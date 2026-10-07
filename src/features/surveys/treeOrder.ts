import { type Category, type OrderInput, type Question, type Subcategory } from '@/api/surveys.types';

/* Pure ordering helpers. Local reordering is kept as an OrderSpec (id lists per
   sibling group) rather than a copied tree, so concurrent edits to node fields
   (which refetch the tree) never overwrite a pending reorder. Group keys:
   'categories' · `subs:<categoryId>` · `cat:<categoryId>` (direct questions) ·
   `sub:<subcategoryId>`. */

export type OrderSpec = Record<string, string[]>;

export const CATEGORIES_GROUP = 'categories';
export const subsGroup = (categoryId: string) => `subs:${categoryId}`;
export const catQuestionsGroup = (categoryId: string) => `cat:${categoryId}`;
export const subQuestionsGroup = (subcategoryId: string) => `sub:${subcategoryId}`;

/** Group key of the list a question sits in. */
export function questionGroup(q: Pick<Question, 'categoryId' | 'subcategoryId'>): string {
  return q.subcategoryId ? subQuestionsGroup(q.subcategoryId) : catQuestionsGroup(q.categoryId);
}

/** Items in `ids` order first; ids not listed keep their original order at the end. */
export function sortByIds<T extends { id: string }>(items: readonly T[], ids: readonly string[] | undefined): T[] {
  if (!ids || ids.length === 0) return [...items];
  const rank = new Map(ids.map((id, i) => [id, i]));
  return items
    .map((item, i) => ({ item, key: rank.has(item.id) ? (rank.get(item.id) ?? 0) : ids.length + i }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}

/** The server tree re-sorted by a pending spec. */
export function applyOrder(categories: readonly Category[], spec: OrderSpec): Category[] {
  return sortByIds(categories, spec[CATEGORIES_GROUP]).map((c) => ({
    ...c,
    questions: sortByIds(c.questions, spec[catQuestionsGroup(c.id)]),
    subcategories: sortByIds(c.subcategories, spec[subsGroup(c.id)]).map((s) => ({ ...s, questions: sortByIds(s.questions, spec[subQuestionsGroup(s.id)]) })),
  }));
}

/** Current ids of one sibling group in a (displayed) tree; [] when the group is unknown. */
export function groupIds(categories: readonly Category[], group: string): string[] {
  if (group === CATEGORIES_GROUP) return categories.map((c) => c.id);
  const [kind, id] = group.split(':');
  if (kind === 'subs') return categories.find((c) => c.id === id)?.subcategories.map((s) => s.id) ?? [];
  if (kind === 'cat') return categories.find((c) => c.id === id)?.questions.map((q) => q.id) ?? [];
  if (kind === 'sub') {
    for (const c of categories) {
      const s = c.subcategories.find((x) => x.id === id);
      if (s) return s.questions.map((q) => q.id);
    }
  }
  return [];
}

/** Move `id` to `index` (clamped); unchanged when `id` is absent. */
export function moveIdTo(ids: readonly string[], id: string, index: number): string[] {
  const from = ids.indexOf(id);
  if (from === -1) return [...ids];
  const next = ids.filter((x) => x !== id);
  const to = Math.max(0, Math.min(next.length, index));
  next.splice(to, 0, id);
  return next;
}

export function moveIdBy(ids: readonly string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id);
  if (from === -1) return [...ids];
  return moveIdTo(ids, id, from + delta);
}

/** True when `spec` reproduces the server order exactly (nothing to save). */
export function isSameOrder(categories: readonly Category[], spec: OrderSpec): boolean {
  return Object.entries(spec).every(([group, ids]) => {
    const current = groupIds(categories, group);
    return current.length === ids.length && current.every((id, i) => id === ids[i]);
  });
}

const entries = (qs: readonly Question[]) => qs.map((q, i) => ({ id: q.id, order: i + 1 }));
const subEntries = (ss: readonly Subcategory[]) => ss.map((s, i) => ({ id: s.id, order: i + 1, questions: entries(s.questions) }));

/** PUT /surveys/:id/order payload for a displayed tree: every node, 1-based order. */
export function buildOrderInput(categories: readonly Category[]): OrderInput {
  return { categories: categories.map((c, i) => ({ id: c.id, order: i + 1, questions: entries(c.questions), subcategories: subEntries(c.subcategories) })) };
}

/** How many sibling groups the spec changes against the server order. */
export function changedGroups(categories: readonly Category[], spec: OrderSpec): number {
  return Object.entries(spec).filter(([group, ids]) => {
    const current = groupIds(categories, group);
    return current.length !== ids.length || current.some((id, i) => id !== ids[i]);
  }).length;
}

export function hasPendingOrder(categories: readonly Category[], spec: OrderSpec): boolean {
  return changedGroups(categories, spec) > 0;
}
