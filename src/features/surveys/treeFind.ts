import { type Category, type Question, type Subcategory } from '@/api/surveys.types';

import { type Selection } from './editorContext';

/* Lookups over the displayed tree. Every node id is unique within a version,
   so a flat search by id is enough; the parents come back with the node
   because the forms need them (placement, sibling weights, delete summaries). */

export function findCategory(categories: readonly Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function findSubcategory(categories: readonly Category[], id: string): { category: Category; subcategory: Subcategory } | undefined {
  for (const category of categories) {
    const subcategory = category.subcategories.find((s) => s.id === id);
    if (subcategory) return { category, subcategory };
  }
  return undefined;
}

export function findQuestion(categories: readonly Category[], id: string): { category: Category; subcategory: Subcategory | null; question: Question } | undefined {
  for (const category of categories) {
    const direct = category.questions.find((q) => q.id === id);
    if (direct) return { category, subcategory: null, question: direct };
    for (const subcategory of category.subcategories) {
      const nested = subcategory.questions.find((q) => q.id === id);
      if (nested) return { category, subcategory, question: nested };
    }
  }
  return undefined;
}

/** The questions that share a placement (category, or one subcategory). */
export function siblingQuestions(categories: readonly Category[], categoryId: string, subcategoryId: string | null): Question[] {
  const category = findCategory(categories, categoryId);
  if (!category) return [];
  if (!subcategoryId) return category.questions;
  return category.subcategories.find((s) => s.id === subcategoryId)?.questions ?? [];
}

/** False when an id-bearing selection no longer names a node (deleted, or a stale deep link). */
export function selectionExists(categories: readonly Category[], selected: Selection): boolean {
  switch (selected.kind) {
    case 'category':
      return Boolean(findCategory(categories, selected.id));
    case 'subcategory':
      return Boolean(findSubcategory(categories, selected.id));
    case 'question':
      return Boolean(findQuestion(categories, selected.id));
    case 'new-category':
      return true;
    case 'new-subcategory':
      return Boolean(findCategory(categories, selected.categoryId));
    case 'new-question':
      return selected.subcategoryId ? Boolean(findSubcategory(categories, selected.subcategoryId)) : Boolean(findCategory(categories, selected.categoryId));
  }
}

/** True when the selection sits inside this category (the tree expands it). */
export function selectionInCategory(selected: Selection | null, category: Category): boolean {
  if (!selected) return false;
  if ('categoryId' in selected) return selected.categoryId === category.id;
  if (selected.kind === 'category') return selected.id === category.id;
  if (selected.kind === 'subcategory') return category.subcategories.some((s) => s.id === selected.id);
  if (selected.kind === 'question') return category.questions.some((q) => q.id === selected.id) || category.subcategories.some((s) => s.questions.some((q) => q.id === selected.id));
  return false;
}
