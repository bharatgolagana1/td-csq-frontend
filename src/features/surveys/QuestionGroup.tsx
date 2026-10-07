import { type Question } from '@/api/surveys.types';
import { Icon } from '@/design/icons';
import { Button } from '@/design/primitives';

import { isSelected, useEditor } from './editorContext';
import { activeQuestions, summariseWeights, type WeightSummary } from './surveyRules';
import styles from './surveys.module.css';
import { TreeRow } from './TreeRow';
import { moveIdBy } from './treeOrder';
import { type DragRowProps } from './useDragOrder';

export type QuestionGroupProps = {
  group: string;
  questions: Question[];
  categoryId: string;
  subcategoryId: string | null;
  rowProps: (group: string, ids: readonly string[], id: string) => DragRowProps;
  announce: (text: string) => void;
};

export function weightNote(s: WeightSummary): string {
  if (s.count === 0) return '';
  if (s.state === 'unweighted') return 'equal weights';
  if (s.state === 'partial') return `weights ${s.total} % · ${s.missing.length} unset`;
  return `weights ${s.total} %`;
}

/** The questions directly under a category or inside a subcategory, with their weight total and the add action. */
export function QuestionGroup({ group, questions, categoryId, subcategoryId, rowProps, announce }: QuestionGroupProps) {
  const { readOnly, selected, select, reorder } = useEditor();
  const ids = questions.map((q) => q.id);
  const summary = summariseWeights(activeQuestions(questions));
  const note = weightNote(summary);

  const move = (q: Question, delta: -1 | 1) => {
    const next = moveIdBy(ids, q.id, delta);
    reorder(group, next);
    announce(`${q.code} moved to position ${next.indexOf(q.id) + 1} of ${next.length}`);
  };

  return (
    <>
      {note ? (
        <div className={styles.groupHead}>
          <span className={styles.weightNote} data-state={summary.state} title="Question weights in this group (active questions only)">
            {note}
          </span>
        </div>
      ) : null}
      {questions.length > 0 ? (
        <ul className={styles.groupList} aria-label="Questions">
          {questions.map((q, i) => (
            <TreeRow
              key={q.id}
              variant="question"
              code={q.code.split('.').pop() ?? q.code}
              label={q.text}
              meta={
                <>
                  {!q.active ? <span>inactive</span> : null}
                  {q.weightPct !== null ? <span>{q.weightPct} %</span> : null}
                </>
              }
              selected={isSelected(selected, 'question', q.id)}
              inactive={!q.active}
              index={i}
              count={questions.length}
              canEdit={!readOnly}
              onSelect={() => select({ kind: 'question', id: q.id })}
              onMove={(d) => move(q, d)}
              drag={rowProps(group, ids, q.id)}
            />
          ))}
        </ul>
      ) : null}
      {!readOnly ? (
        <div className={styles.groupFoot}>
          <Button size="sm" variant="ghost" icon={<Icon name="plus" size={16} />} onClick={() => select({ kind: 'new-question', categoryId, subcategoryId })}>
            Question
          </Button>
        </div>
      ) : null}
    </>
  );
}
