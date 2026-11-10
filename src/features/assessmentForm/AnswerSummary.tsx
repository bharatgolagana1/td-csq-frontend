import { Pill, RatingPill, Tag } from '@/design/primitives';
import { cn } from '@/lib/cn';
import type { AnswerMode } from '@/api/assessments.types';

import styles from './AnswerSummary.module.css';
import { type AnswerGroup, type AnswerGroupItem } from './types';

export type AnswerSummaryProps = {
  groups: AnswerGroup[];
  className?: string;
  answerMode?: AnswerMode;
};

function AnswerValue({ answer }: { answer: AnswerGroupItem['answer'] }) {
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

function AnswerExtras({ answer }: { answer: AnswerGroupItem['answer'] }) {
  if (!answer || (answer.followUp.length === 0 && !answer.comment)) {
    return null;
  }

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

      {answer.comment ? (
        <blockquote className={styles.comment}>
          {answer.comment}
        </blockquote>
      ) : null}
    </div>
  );
}

export function AnswerSummary({
  groups,
  className,
  answerMode = 'SINGLE',
}: AnswerSummaryProps) {
  const isImportExport = answerMode === 'IMPORT_EXPORT';

  return (
    <div className={cn(styles.root, className)}>
      {groups.map((group) => {
        const answered = group.items.reduce(
          (count, item) =>
            count +
            (isImportExport
              ? Number(item.importAnswer != null) +
                Number(item.exportAnswer != null)
              : Number(item.answer != null)),
          0,
        );

        const total = group.items.length * (isImportExport ? 2 : 1);

        return (
          <section
            key={group.id}
            className={styles.group}
            aria-labelledby={`answers-${group.id}`}
          >
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
                      {item.subcategory ? (
                        <span> · {item.subcategory}</span>
                      ) : null}
                    </p>

                    <p className={styles.itemText}>
                      {item.question.text}
                    </p>
                  </div>

                  {isImportExport ? (
                    <div className={styles.directionList}>
                      <section
                        className={styles.directionPanel}
                        aria-label="Import answer"
                      >
                        <div className={styles.directionHead}>
                          <strong>Import</strong>
                          <AnswerValue answer={item.importAnswer ?? null} />
                        </div>

                        <AnswerExtras answer={item.importAnswer ?? null} />
                      </section>

                      <section
                        className={styles.directionPanel}
                        aria-label="Export answer"
                      >
                        <div className={styles.directionHead}>
                          <strong>Export</strong>
                          <AnswerValue answer={item.exportAnswer ?? null} />
                        </div>

                        <AnswerExtras answer={item.exportAnswer ?? null} />
                      </section>
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
          </section>
        );
      })}
    </div>
  );
}
