import styles from './history.module.css';

/** A score withheld from this viewer (no `assessments.scores`): a dash, named "Score hidden" on hover and for screen readers. */
export function HiddenScore() {
  return (
    <span className={styles.dash} title="Score hidden">
      <span aria-hidden="true">—</span>
      <span className="visually-hidden">Score hidden</span>
    </span>
  );
}
