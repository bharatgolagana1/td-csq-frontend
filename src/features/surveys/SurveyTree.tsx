import { useState } from 'react';

import { Icon } from '@/design/icons';
import { Button, EmptyState } from '@/design/primitives';

import { CategoryBlock } from './CategoryBlock';
import { useEditor } from './editorContext';
import styles from './surveys.module.css';
import { useDragOrder } from './useDragOrder';

/** The left column: categories → subcategories → questions, drag-and-drop and keyboard moves within each sibling group. */
export function SurveyTree() {
  const { categories, readOnly, select, reorder } = useEditor();
  const [live, setLive] = useState('');
  const { rowProps } = useDragOrder(reorder, !readOnly);
  const ids = categories.map((c) => c.id);

  return (
    <div className={styles.tree}>
      {categories.length === 0 ? (
        <EmptyState
          size="sm"
          icon="list-check"
          title="No categories yet"
          description={readOnly ? 'This version has no content.' : 'Start with a head such as Infrastructure, then add its questions.'}
          action={
            !readOnly ? (
              <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={() => select({ kind: 'new-category' })}>
                Add category
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {categories.map((category, i) => (
        <CategoryBlock key={category.id} category={category} index={i} count={categories.length} ids={ids} rowProps={rowProps} announce={setLive} />
      ))}
      {!readOnly && categories.length > 0 ? (
        <div className={styles.treeFoot}>
          <Button size="sm" variant="secondary" icon={<Icon name="plus" size={16} />} onClick={() => select({ kind: 'new-category' })}>
            Category
          </Button>
        </div>
      ) : null}
      <div className={styles.liveRegion} aria-live="polite">
        {live}
      </div>
    </div>
  );
}
