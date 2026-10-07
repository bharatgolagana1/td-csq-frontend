import { type ReactNode } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { type PublicInvitation } from '@/api/publicAssess.types';
import { Icon, type IconName } from '@/design/icons';
import { Button } from '@/design/primitives';

import styles from './assess.module.css';
import { cycleTz, formatZoned } from './format';
import { useFocusHeading } from './useFocusHeading';

export type ClosedVariant = 'expired' | 'submitted' | 'revoked' | 'notFound' | 'error';

export type AssessClosedProps = {
  variant: ClosedVariant;
  invitation?: PublicInvitation | null;
  submittedAt?: string | null;
  error?: unknown;
  onRetry?: () => void;
};

type Copy = { icon: IconName; tone: 'neutral' | 'success' | 'warn' | 'danger'; eyebrow: string; title: string; text: ReactNode; meta?: ReactNode };

function copyFor({ variant, invitation, submittedAt, error }: AssessClosedProps): Copy {
  const operator = invitation?.operator.name;
  const tz = cycleTz(invitation);
  switch (variant) {
    case 'expired':
      return {
        icon: 'clock',
        tone: 'neutral',
        eyebrow: 'Assessment closed',
        title: 'This assessment has closed',
        text: (
          <>
            The window for {invitation ? <strong>{invitation.cycle.name}</strong> : 'this cycle'} has ended, so the link no longer accepts answers. If you believe
            this is a mistake, contact {operator ?? 'the operator'}.
          </>
        ),
        meta: invitation ? `Closed ${formatZoned(invitation.cycle.assessmentEnd, tz)}` : undefined,
      };
    case 'submitted':
      return {
        icon: 'check',
        tone: 'success',
        eyebrow: 'Already submitted',
        title: 'Thank you — this assessment is in',
        text: (
          <>
            Your answers for {operator ? <strong>{operator}</strong> : 'this operator'} were submitted and are now locked. Your answers reach the operator only in
            aggregate.
          </>
        ),
        meta: submittedAt ? `Submitted ${formatZoned(submittedAt, tz)}` : undefined,
      };
    case 'revoked':
      return {
        icon: 'lock',
        tone: 'warn',
        eyebrow: 'Link withdrawn',
        title: 'This link is no longer active',
        text: <>The invitation behind this link was withdrawn. If you think you should still take part, contact {operator ?? 'the operator who invited you'}.</>,
      };
    case 'notFound':
      return {
        icon: 'link',
        tone: 'neutral',
        eyebrow: 'Unknown link',
        title: 'We could not find this invitation',
        text: <>Check the link in your e-mail — it may have been replaced by a newer one. Open the most recent message from CSQ and use the link there.</>,
      };
    case 'error':
      return {
        icon: 'warning',
        tone: 'danger',
        eyebrow: 'Something went wrong',
        title: 'We could not open this invitation',
        text: <>{errorMessage(error)}. Please try again in a moment.</>,
        meta: errorRequestId(error) ? `Request ${errorRequestId(error)}` : undefined,
      };
  }
}

/** The calm full-screen states: expired, submitted, revoked, notFound, error. */
export function AssessClosed(props: AssessClosedProps) {
  const heading = useFocusHeading<HTMLHeadingElement>();
  const copy = copyFor(props);
  return (
    <section className={`${styles.card} ${styles.closed}`} aria-labelledby="assess-closed-title">
      <span className={`${styles.closedIcon} ${copy.tone !== 'neutral' ? styles[copy.tone] : ''}`} aria-hidden="true">
        <Icon name={copy.icon} size={24} />
      </span>
      <p className={styles.eyebrow}>{copy.eyebrow}</p>
      <h1 id="assess-closed-title" className={styles.title} tabIndex={-1} ref={heading}>
        {copy.title}
      </h1>
      <p className={styles.closedText}>{copy.text}</p>
      {copy.meta ? <p className={styles.closedMeta}>{copy.meta}</p> : null}
      {props.variant === 'error' && props.onRetry ? (
        <div className={styles.closedActions}>
          <Button variant="primary" size="lg" onClick={props.onRetry} icon={<Icon name="refresh" size={18} />}>
            Try again
          </Button>
        </div>
      ) : null}
    </section>
  );
}
