import { useEffect, useId, useState } from 'react';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useRequestOtp, useVerifyOtp } from '@/api/publicAssess';
import { type LinkSession, type PublicInvitation } from '@/api/publicAssess.types';
import { Icon } from '@/design/icons';
import { Button } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './assess.module.css';
import { OtpInput } from './OtpInput';
import { useCooldown } from './useCooldown';

export const OTP_LENGTH = 6;
export const OTP_MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_S = 30;

export type OtpScreenProps = {
  token: string;
  invitation: PublicInvitation;
  /** From the OTP response when the backend runs with DEMO_REVEAL_OTP. */
  devOtp?: string;
  onVerified: (session: LinkSession) => void;
  onExpired: () => void;
};

type Feedback = { tone: 'hint' | 'error'; text: string };

/** `attemptsLeft` from the server when it says so, else our own count. */
function attemptsLeftFrom(error: unknown, local: number): number {
  if (isApiError(error, 'OTP_INVALID') && error.details && typeof error.details === 'object') {
    const left = (error.details as { attemptsLeft?: unknown }).attemptsLeft;
    if (typeof left === 'number') return Math.max(0, left);
  }
  return local;
}

function retryAfterSeconds(error: unknown): number | null {
  if (isApiError(error, 'RATE_LIMITED') && error.details && typeof error.details === 'object') {
    const ms = (error.details as { retryAfterMs?: unknown }).retryAfterMs;
    if (typeof ms === 'number' && ms > 0) return Math.ceil(ms / 1000);
  }
  return null;
}

/**
 * State `otp`: six boxes, verify, resend with a 30 s cooldown, attempts hint,
 * dev banner. Focus lands in the first box (not the heading): the code is the
 * only thing to do here, and the box is labelled and described by the hint.
 */
export function OtpScreen({ token, invitation, devOtp: initialDevOtp, onVerified, onExpired }: OtpScreenProps) {
  const hintId = useId();
  const verify = useVerifyOtp(token);
  const resend = useRequestOtp(token);
  const cooldown = useCooldown();
  const [code, setCode] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const { start } = cooldown;
  useEffect(() => {
    start(RESEND_COOLDOWN_S);
  }, [start]);

  const locked = attemptsLeft <= 0;
  const complete = code.length === OTP_LENGTH;

  const submit = (value = code) => {
    if (value.length !== OTP_LENGTH || verify.isPending || locked) return;
    verify.mutate(value, {
      onSuccess: (session) => onVerified(session),
      onError: (e) => {
        if (isApiError(e, 'LINK_EXPIRED')) {
          onExpired();
          return;
        }
        if (isApiError(e, 'OTP_INVALID')) {
          const left = attemptsLeftFrom(e, attemptsLeft - 1);
          setAttemptsLeft(left);
          setCode('');
          setFeedback({
            tone: 'error',
            text: left > 0 ? `That code is not right · ${left} ${left === 1 ? 'attempt' : 'attempts'} left` : 'No attempts left for this code. Request a new one below.',
          });
          return;
        }
        if (isApiError(e, 'RATE_LIMITED')) {
          setFeedback({ tone: 'error', text: 'Too many attempts. Please wait a moment and try again.' });
          return;
        }
        setFeedback({ tone: 'error', text: `${errorMessage(e)}${errorRequestId(e) ? ` · Request ${errorRequestId(e)}` : ''}` });
      },
    });
  };

  const doResend = () => {
    if (cooldown.active || resend.isPending) return;
    resend.mutate(undefined, {
      onSuccess: (res) => {
        setDevOtp(res?.devOtp);
        setCode('');
        setAttemptsLeft(OTP_MAX_ATTEMPTS);
        verify.reset();
        setFeedback({ tone: 'hint', text: `A new code is on its way to ${invitation.customer.emailMasked}.` });
        start(RESEND_COOLDOWN_S);
      },
      onError: (e) => {
        if (isApiError(e, 'LINK_EXPIRED')) {
          onExpired();
          return;
        }
        const after = retryAfterSeconds(e);
        if (isApiError(e, 'RATE_LIMITED')) {
          setFeedback({
            tone: 'error',
            text: after ? `Too many codes requested. Try again in about ${Math.max(1, Math.round(after / 60))} min.` : 'Too many codes requested. Please wait a few minutes and try again.',
          });
          start(after ?? 60);
          return;
        }
        setFeedback({ tone: 'error', text: `${errorMessage(e)}${errorRequestId(e) ? ` · Request ${errorRequestId(e)}` : ''}` });
      },
    });
  };

  const hint = feedback ?? { tone: 'hint' as const, text: `Valid for 10 minutes · ${OTP_MAX_ATTEMPTS} attempts per code` };

  return (
    <section className={styles.card} aria-labelledby="assess-otp-title">
      <p className={styles.eyebrow}>Check your e-mail</p>
      <h1 id="assess-otp-title" className={styles.title}>
        Enter the code
      </h1>
      <p className={styles.lede}>
        We sent a six-digit code to <strong className={styles.mono}>{invitation.customer.emailMasked}</strong>.
      </p>

      {devOtp ? (
        <div className={styles.devBanner} data-testid="dev-otp">
          <span>
            Dev build · your code is <span className={styles.devCode}>{devOtp}</span>
          </span>
          <Button size="sm" variant="secondary" onClick={() => setCode(devOtp)} disabled={locked}>
            Fill
          </Button>
        </div>
      ) : null}

      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v);
          if (feedback?.tone === 'error' && !locked) setFeedback(null);
        }}
        onComplete={(v) => submit(v)}
        length={OTP_LENGTH}
        disabled={locked || verify.isPending}
        invalid={feedback?.tone === 'error' && isApiError(verify.error, 'OTP_INVALID')}
        focusWhenEmpty
        describedBy={hintId}
      />
      <p id={hintId} className={cn(styles.otpHint, hint.tone === 'error' && styles.otpError)} role={hint.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
        {hint.text}
      </p>

      <div className={styles.otpActions}>
        {locked ? (
          <Button variant="primary" size="lg" full loading={resend.isPending} disabled={cooldown.active} onClick={doResend} icon={<Icon name="refresh" size={18} />}>
            {cooldown.active ? `Request a new code in ${cooldown.remaining} s` : 'Request a new code'}
          </Button>
        ) : (
          <Button variant="primary" size="lg" full loading={verify.isPending} disabled={!complete} onClick={() => submit()}>
            Verify and start
          </Button>
        )}
        {!locked ? (
          <div className={styles.resendRow}>
            <span>Did not get it?</span>
            <Button variant="ghost" size="lg" loading={resend.isPending} disabled={cooldown.active} onClick={doResend}>
              {cooldown.active ? `Resend in ${cooldown.remaining} s` : 'Resend code'}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
