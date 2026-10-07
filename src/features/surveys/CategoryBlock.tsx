import { useEffect, useState } from 'react';

import { type Category, type Subcategory } from '@/api/surveys.types';
import { Icon } from '@/design/icons';
import { Button, IconButton } from '@/design/primitives';

import { isSelected, useEditor } from './editorContext';
import { QuestionGroup } from './QuestionGroup';
import { activeQuestions } from './surveyRules';
import styles from './surveys.module.css';
import { selectionInCategory } from './treeFind';
import { CATEGORIES_GROUP, catQuestionsGroup, moveIdBy, subQuestionsGroup, subsGroup } from './treeOrder';
import { TreeRow } from './TreeRow';
import { type DragRowProps } from './useDragOrder';

export type CategoryBlockProps = {
  category: Category;
  index: number;
  count: number;
  /** Ids of every category, in displayed order. */
  ids: readonly string[];
  rowProps: (group: string, ids: readonly string[], id: string) => DragRowProps;
  announce: (text: string) => void;
};

function countActive(category: Category): number {
  return activeQuestions(category.questions).length + category.subcategories.reduce((n, s) => n + activeQuestions(s.questions).length, 0);
}

/** One category of the tree: its row, its direct questions, and each subcategory with its questions. Collapsible. */
export function CategoryBlock({ category, index, count, ids, rowProps, announce }: CategoryBlockProps) {
  const { readOnly, selected, select, reorder } = useEditor();
  const [collapsed, setCollapsed] = useState(false);
  const inside = selectionInCategory(selected, category);

  // A selection inside (a click in the tree, a deep link) always reveals itself.
  useEffect(() => {
    if (inside) setCollapsed(false);
  }, [inside, selected]);

  const subIds = category.subcategories.map((s) => s.id);
  const activeCount = countActive(category);

  const moveCategory = (delta: -1 | 1) => {
    const next = moveIdBy(ids, category.id, delta);
    reorder(CATEGORIES_GROUP, next);
    announce(`${category.code} moved to position ${next.indexOf(category.id) + 1} of ${next.length}`);
  };
  const moveSub = (s: Subcategory, delta: -1 | 1) => {
    const next = moveIdBy(subIds, s.id, delta);
    reorder(subsGroup(category.id), next);
    announce(`${s.code} moved to position ${next.indexOf(s.id) + 1} of ${next.length}`);
  };

  return (
    <div className={styles.cat} data-collapsed={collapsed || undefined}>
      <div className={styles.catHead}>
        <TreeRow
          as="div"
          variant="category"
          className={styles.catRow}
          code={category.code}
          label={category.name}
          meta={
            <>
              <span>{activeCount} q</span>
              {category.weightPct !== null ? <span>{category.weightPct} %</span> : null}
            </>
          }
          prefix={
            <IconButton
              size="sm"
              label={collapsed ? `Expand ${category.code}` : `Collapse ${category.code}`}
              aria-expanded={!collapsed}
              aria-controls={`cat-${category.id}`}
              icon={<Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={16} />}
              onClick={() => setCollapsed((c) => !c)}
            />
          }
          selected={isSelected(selected, 'category', category.id)}
          index={index}
          count={count}
          canEdit={!readOnly}
          onSelect={() => select({ kind: 'category', id: category.id })}
          onMove={moveCategory}
          drag={rowProps(CATEGORIES_GROUP, ids, category.id)}
        />
      </div>
      {!collapsed ? (
        <div id={`cat-${category.id}`} className={styles.catBody}>
          <QuestionGroup group={catQuestionsGroup(category.id)} questions={category.questions} categoryId={category.id} subcategoryId={null} rowProps={rowProps} announce={announce} />
          {category.subcategories.map((s, i) => (
            <div key={s.id} className={styles.group}>
              <TreeRow
                as="div"
                variant="subcategory"
                code={s.code}
                label={s.name}
                meta={<span>{activeQuestions(s.questions).length} q</span>}
                selected={isSelected(selected, 'subcategory', s.id)}
                index={i}
                count={category.subcategories.length}
                canEdit={!readOnly}
                onSelect={() => select({ kind: 'subcategory', id: s.id })}
                onMove={(d) => moveSub(s, d)}
                drag={rowProps(subsGroup(category.id), subIds, s.id)}
              />
              <QuestionGroup group={subQuestionsGroup(s.id)} questions={s.questions} categoryId={category.id} subcategoryId={s.id} rowProps={rowProps} announce={announce} />
            </div>
          ))}
          {!readOnly ? (
            <div className={styles.groupFoot}>
              <Button size="sm" variant="ghost" icon={<Icon name="plus" size={16} />} onClick={() => select({ kind: 'new-subcategory', categoryId: category.id })}>
                Subcategory
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
