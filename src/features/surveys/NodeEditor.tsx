import { type ReactNode } from 'react';

import { EmptyState, Tag } from '@/design/primitives';

import { CategoryForm } from './CategoryForm';
import { useEditor } from './editorContext';
import { placementKey } from './nodeForms';
import { QuestionForm } from './QuestionForm';
import { SubcategoryForm } from './SubcategoryForm';
import styles from './surveys.module.css';
import { findCategory, findQuestion, findSubcategory } from './treeFind';

/** The right column: the form of the selected node (keyed by id so each node starts from its own values). */
export function NodeEditor() {
  const { categories, selected, readOnly } = useEditor();

  if (!selected) {
    return (
      <EmptyState
        className={styles.editorEmpty}
        icon="edit"
        title="Nothing selected"
        description={readOnly ? 'Pick a category, subcategory or question in the tree to see its details.' : 'Pick a category, subcategory or question in the tree to edit it, or add a new one.'}
      />
    );
  }

  const head = (kind: string, code: string | null): ReactNode => (
    <div className={styles.colHead}>
      <div className={styles.editorTitle}>
        <span className={styles.editorKind}>{kind}</span>
        {code ? <code className={styles.editorCode}>{code}</code> : null}
      </div>
      {readOnly ? <Tag tone="outline">Read-only</Tag> : null}
    </div>
  );
  const gone = <EmptyState className={styles.editorEmpty} icon="info" size="sm" title="This node no longer exists" description="It was removed, or the link is out of date." />;

  switch (selected.kind) {
    case 'category': {
      const category = findCategory(categories, selected.id);
      if (!category) return gone;
      return (
        <>
          {head('Category', category.code)}
          <CategoryForm key={category.id} category={category} />
        </>
      );
    }
    case 'subcategory': {
      const found = findSubcategory(categories, selected.id);
      if (!found) return gone;
      return (
        <>
          {head('Subcategory', found.subcategory.code)}
          <SubcategoryForm key={found.subcategory.id} subcategory={found.subcategory} categoryId={found.category.id} />
        </>
      );
    }
    case 'question': {
      const found = findQuestion(categories, selected.id);
      if (!found) return gone;
      return (
        <>
          {head('Question', found.question.code)}
          <QuestionForm key={found.question.id} question={found.question} placement={placementKey(found.category.id, found.subcategory?.id ?? null)} />
        </>
      );
    }
    case 'new-category':
      return (
        <>
          {head('New category', null)}
          <CategoryForm key="new-category" category={null} />
        </>
      );
    case 'new-subcategory':
      return (
        <>
          {head('New subcategory', findCategory(categories, selected.categoryId)?.code ?? null)}
          <SubcategoryForm key={`new-subcategory-${selected.categoryId}`} subcategory={null} categoryId={selected.categoryId} />
        </>
      );
    case 'new-question': {
      const placement = placementKey(selected.categoryId, selected.subcategoryId);
      return (
        <>
          {head('New question', null)}
          <QuestionForm key={`new-question-${placement}`} question={null} placement={placement} />
        </>
      );
    }
  }
}
