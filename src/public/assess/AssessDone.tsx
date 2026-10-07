import { type PublicInvitation } from '@/api/publicAssess.types';
import { Icon } from '@/design/icons';

import styles from './assess.module.css';
import { cycleTz, formatZoned } from './format';
import { useFocusHeading } from './useFocusHeading';

export type AssessDoneProps = {
  invitation: PublicInvitation;
  submittedAt: string;
};

/** State `done`: the thank-you with the submission time in the cycle's zone. */
export function AssessDone({ invitation, submittedAt }: AssessDoneProps) {
  const heading = useFocusHeading<HTMLHeadingElement>();
  const airport = invitation.operator.airport;
  return (
    <section className={`${styles.card} ${styles.closed}`} aria-labelledby="assess-done-title">
      <span className={`${styles.closedIcon} ${styles.success}`} aria-hidden="true">
        <Icon name="check" size={24} />
      </span>
      <p className={styles.eyebrow}>Submitted</p>
      <h1 id="assess-done-title" className={styles.title} tabIndex={-1} ref={heading}>
        Thank you
      </h1>
      <p className={styles.closedText}>
        Your assessment of <strong>{invitation.operator.name}</strong>
        {airport ? <> at {airport.iata}</> : null} is in. Your answers reach the operator only in aggregate.
      </p>
      <p className={styles.closedMeta}>Submitted {formatZoned(submittedAt, cycleTz(invitation))}</p>
      <p className={`${styles.closedText} ${styles.factMuted}`}>A confirmation is on its way to your e-mail. You can close this page.</p>
    </section>
  );
}
