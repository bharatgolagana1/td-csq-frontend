import styles from './history.module.css';

/** The draft's dash: no score until the assessment is submitted (the API sends none). */
export const DRAFT_SCORE_LABEL = 'No score until submitted';

/** A score this viewer does not get — withheld (no `assessments.scores`) or not there yet (a draft): a dash, named by `label` on hover and for screen readers. */
export function HiddenScore({ label = 'Score hidden' }: { label?: string }) {
  return (
    <span className={styles.dash} title={label}>
      <span aria-hidden="true">—</span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
