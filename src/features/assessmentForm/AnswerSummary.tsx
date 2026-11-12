import { type AnswerDirection, type AnswerMode } from '@/api/assessments.types';
import { Pill, RatingPill, Tag } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './AnswerSummary.module.css';
import { ANSWER_DIRECTIONS, DIRECTION_LABELS } from './rules';
import { type AnswerGroup, type AnswerGroupAnswer, type AnswerGroupItem } from './types';

export type AnswerSummaryProps = {
  groups: AnswerGroup[];
  /** IMPORT_EXPORT shows each question's import and export answer side by side (default SINGLE). */
  answerMode?: AnswerMode;
  className?: string;
};

function AnswerValue({ answer }: { answer: AnswerGroupAnswer | null }) {
  if (!answer) {
    return (
      <Pill variant="neutral" dot={false} size="sm">
        Not answered
      </Pill>
    );
  }
  if (answer.na) {
    return (
      <Pill variant="na" size="sm">
        NA
      </Pill>
    );
  }
  return <RatingPill rating={answer.rating} size="sm" />;
}

function AnswerExtras({ answer }: { answer: AnswerGroupAnswer | null }) {
  if (!answer || (answer.followUp.length === 0 && !answer.comment)) return null;
  return (
    <div className={styles.itemExtra}>
      {answer.followUp.length > 0 ? (
        <div className={styles.tags}>
          {answer.followUp.map((option) => (
            <Tag key={option} tone="outline">
              {option}
            </Tag>
          ))}
        </div>
      ) : null}
      {answer.comment ? <blockquote className={styles.comment}>{answer.comment}</blockquote> : null}
    </div>
  );
}

function directionAnswer(item: AnswerGroupItem, direction: AnswerDirection): AnswerGroupAnswer | null {
  return (direction === 'IMPORT' ? item.importAnswer : item.exportAnswer) ?? null;
}

/** Read-only answers by category: rating pills, follow-up tags and comments, then the section's remark (self done state, history return). */
export function AnswerSummary({ groups, answerMode = 'SINGLE', className }: AnswerSummaryProps) {
  const directed = answerMode === 'IMPORT_EXPORT';
  return (
    <div className={cn(styles.root, className)}>
      {groups.map((group) => {
        const answered = directed ? group.items.reduce((n, i) => n + ANSWER_DIRECTIONS.filter((d) => directionAnswer(i, d) !== null).length, 0) : group.items.filter((i) => i.answer !== null).length;
        const total = group.items.length * (directed ? ANSWER_DIRECTIONS.length : 1);
        return (
          <section key={group.id} className={styles.group} aria-labelledby={`answers-${group.id}`}>
            <header className={styles.groupHead}>
              <h3 id={`answers-${group.id}`} className={styles.groupTitle}>
                {group.name}
              </h3>
              <span className={styles.groupCount}>
                {answered}/{total}
              </span>
            </header>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.question.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <p className={styles.itemEyebrow}>
                      <span className="num">{item.question.code}</span>
                      {item.subcategory ? <span> · {item.subcategory}</span> : null}
                    </p>
                    <p className={styles.itemText}>{item.question.text}</p>
                  </div>
                  {directed ? (
                    <div className={styles.directionList}>
                      {ANSWER_DIRECTIONS.map((direction) => (
                        <section key={direction} className={styles.directionPanel} aria-label={`${DIRECTION_LABELS[direction]} answer`}>
                          <div className={styles.directionHead}>
                            <strong>{DIRECTION_LABELS[direction]}</strong>
                            <AnswerValue answer={directionAnswer(item, direction)} />
                          </div>
                          <AnswerExtras answer={directionAnswer(item, direction)} />
                        </section>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className={styles.itemAnswer}>
                        <AnswerValue answer={item.answer} />
                      </div>
                      <AnswerExtras answer={item.answer} />
                    </>
                  )}
                </li>
              ))}
            </ul>
            {group.remark ? (
              <div className={styles.remark}>
                <h4 className={styles.remarkLabel}>Remarks</h4>
                <p className={styles.remarkText}>{group.remark}</p>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
