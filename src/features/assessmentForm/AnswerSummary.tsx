import { type AnswerDirection, type AnswerMode } from '@/api/assessments.types';
import { Pill, RatingPill, Tag } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './AnswerSummary.module.css';
import { ANSWER_DIRECTIONS, DIRECTION_LABELS } from './rules';
import { type AnswerGroup, type AnswerGroupAnswer, type AnswerGroupItem } from './types';

export type AnswerSummaryProps = {
  groups: AnswerGroup[];
  /** IMPORT_EXPORT shows each question's import and export rating on one row, without comments (default SINGLE). */
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

function FollowUpTags({ options }: { options: readonly string[] }) {
  return (
    <span className={styles.tags}>
      {options.map((option) => (
        <Tag key={option} tone="outline">
          {option}
        </Tag>
      ))}
    </span>
  );
}

function AnswerExtras({ answer }: { answer: AnswerGroupAnswer | null }) {
  if (!answer || (answer.followUp.length === 0 && !answer.comment)) return null;
  return (
    <div className={styles.itemExtra}>
      {answer.followUp.length > 0 ? <FollowUpTags options={answer.followUp} /> : null}
      {answer.comment ? <blockquote className={styles.comment}>{answer.comment}</blockquote> : null}
    </div>
  );
}

function directionAnswer(item: AnswerGroupItem, direction: AnswerDirection): AnswerGroupAnswer | null {
  return (direction === 'IMPORT' ? item.importAnswer : item.exportAnswer) ?? null;
}

/** An IMPORT_EXPORT question's two ratings on its row, then the follow-ups of each direction that has some. No comment lines: the form takes none. */
function DirectionAnswers({ item }: { item: AnswerGroupItem }) {
  const followUps = ANSWER_DIRECTIONS.flatMap((direction) => {
    const options = directionAnswer(item, direction)?.followUp ?? [];
    return options.length > 0 ? [{ direction, options }] : [];
  });
  return (
    <>
      <div className={styles.directionPair}>
        {ANSWER_DIRECTIONS.map((direction) => (
          <div key={direction} role="group" aria-label={`${DIRECTION_LABELS[direction]} answer`} className={styles.directionValue}>
            <span className={styles.directionLabel}>{DIRECTION_LABELS[direction]}</span>
            <AnswerValue answer={directionAnswer(item, direction)} />
          </div>
        ))}
      </div>
      {followUps.length > 0 ? (
        <div className={styles.itemExtra}>
          {followUps.map(({ direction, options }) => (
            <div key={direction} role="group" aria-label={`${DIRECTION_LABELS[direction]} follow-up`} className={styles.directionFollowUp}>
              <span className={styles.directionLabel}>{DIRECTION_LABELS[direction]}</span>
              <FollowUpTags options={options} />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

/** Read-only answers by category: rating pills, follow-up tags and comments (an IMPORT_EXPORT row: both ratings, follow-ups, no comments), then the section's remark (self done state, history return). */
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
                    {/* The question's code (ACFI.INFRA.…) is for analysts: a tooltip on the text, not part of the return. */}
                    {item.subcategory ? <p className={styles.itemEyebrow}>{item.subcategory}</p> : null}
                    <p className={styles.itemText} title={item.question.code}>
                      {item.question.text}
                    </p>
                  </div>
                  {directed ? (
                    <DirectionAnswers item={item} />
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
