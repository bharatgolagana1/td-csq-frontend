import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useRequestOtp } from '@/api/publicAssess';
import { type PublicInvitation } from '@/api/publicAssess.types';
import { Icon } from '@/design/icons';
import { Button } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './assess.module.css';
import { closesOn, stakeholderLabel, surveyTypeLabel } from './format';
import { useFocusHeading } from './useFocusHeading';

export type AssessLandingProps = {
  token: string;
  invitation: PublicInvitation;
  /** Shown when the participant lands here because an earlier session ended. */
  note?: 'session-ended';
  onCodeSent: (devOtp?: string) => void;
  onExpired: () => void;
};

/** State `landing`: who, where, until when, who this link is for — then "Send me a code". */
export function AssessLanding({ token, invitation, note, onCodeSent, onExpired }: AssessLandingProps) {
  const heading = useFocusHeading<HTMLHeadingElement>();
  const request = useRequestOtp(token);
  const closes = closesOn(invitation);
  const stakeholder = stakeholderLabel(invitation.customer.type);
  const airport = invitation.operator.airport;

  const send = () => {
    request.mutate(undefined, {
      onSuccess: (res) => onCodeSent(res?.devOtp),
      onError: (e) => {
        if (isApiError(e, 'LINK_EXPIRED')) onExpired();
      },
    });
  };

  const limited = isApiError(request.error, 'RATE_LIMITED');

  return (
    <section className={styles.card} aria-labelledby="assess-landing-title">
      {note === 'session-ended' ? (
        <p className={styles.note} role="status">
          <Icon name="info" size={18} />
          <span>Your session ended. Request a new code to continue — your saved answers are kept.</span>
        </p>
      ) : null}
      <p className={styles.eyebrow}>Cargo Service Quality · {invitation.cycle.name}</p>
      <h1 id="assess-landing-title" className={styles.title} tabIndex={-1} ref={heading}>
        {invitation.operator.name}
      </h1>
      {airport ? (
        <p className={styles.titleSub}>
          <span className={styles.mono}>{airport.iata}</span> · {airport.name}
        </p>
      ) : null}
      <p className={styles.lede}>
        You have been invited to rate the cargo service you receive from <strong>{invitation.operator.name}</strong>
        {airport ? <> at {airport.name}</> : null}. It takes about ten minutes, and you can pause and come back.
      </p>

      <dl className={styles.facts}>
        <dt className={styles.factKey}>Assessment</dt>
        <dd className={styles.factValue}>
          {invitation.cycle.name}
          <span className={styles.factMuted}> · {surveyTypeLabel(invitation.surveyType)}</span>
        </dd>
        <dt className={styles.factKey}>Closes</dt>
        <dd className={styles.factValue}>
          <span className={styles.num}>{closes.absolute}</span>
          {closes.relative ? <span className={styles.factMuted}> · {closes.relative}</span> : null}
        </dd>
        <dt className={styles.factKey}>This link is for</dt>
        <dd className={styles.factValue}>
          {invitation.customer.nameMasked}
          {stakeholder ? <span className={styles.factMuted}> · {stakeholder}</span> : null}
          <br />
          <span className={styles.mono}>{invitation.customer.emailMasked}</span>
        </dd>
      </dl>

      <p className={styles.confidential}>
        <Icon name="shield" size={18} />
        <span>
          Your answers reach the operator only in aggregate. Nobody at {invitation.operator.name} sees an individual response.
        </span>
      </p>

      <div className={styles.cta}>
        <Button variant="primary" size="lg" full loading={request.isPending} onClick={send} icon={<Icon name="mail" size={18} />}>
          Send me a code
        </Button>
        {request.isError && !isApiError(request.error, 'LINK_EXPIRED') ? (
          <p className={cn(styles.ctaHint, styles.otpError)} role="alert">
            {limited ? 'Too many codes were requested for this link. Please wait a few minutes and try again.' : errorMessage(request.error)}
            {errorRequestId(request.error) ? <> · Request {errorRequestId(request.error)}</> : null}
          </p>
        ) : (
          <p className={styles.ctaHint}>
            We will e-mail a six-digit code to <span className={styles.mono}>{invitation.customer.emailMasked}</span> to confirm it is you.
          </p>
        )}
      </div>
    </section>
  );
}
