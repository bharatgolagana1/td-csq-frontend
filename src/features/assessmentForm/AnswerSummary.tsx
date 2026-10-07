import { Pill, RatingPill, Tag } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './AnswerSummary.module.css';
import { type AnswerGroup, type AnswerGroupItem } from './types';

export type AnswerSummaryProps = {
  groups: AnswerGroup[];
  className?: string;
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

/** Read-only answers by category: rating pills, follow-up tags and comments (self done state, history return). */
export function AnswerSummary({ groups, className }: AnswerSummaryProps) {
  return (
    <div className={cn(styles.root, className)}>
      {groups.map((group) => {
        const answered = group.items.filter((i) => i.answer !== null).length;
        return (
          <section key={group.id} className={styles.group} aria-labelledby={`answers-${group.id}`}>
            <header className={styles.groupHead}>
              <h3 id={`answers-${group.id}`} className={styles.groupTitle}>
                {group.name}
              </h3>
              <span className={styles.groupCount}>
                {answered}/{group.items.length}
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
                  <div className={styles.itemAnswer}>
                    <AnswerValue answer={item.answer} />
                  </div>
                  {item.answer && (item.answer.followUp.length > 0 || item.answer.comment) ? (
                    <div className={styles.itemExtra}>
                      {item.answer.followUp.length > 0 ? (
                        <div className={styles.tags}>
                          {item.answer.followUp.map((option) => (
                            <Tag key={option} tone="outline">
                              {option}
                            </Tag>
                          ))}
                        </div>
                      ) : null}
                      {item.answer.comment ? <blockquote className={styles.comment}>{item.answer.comment}</blockquote> : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
