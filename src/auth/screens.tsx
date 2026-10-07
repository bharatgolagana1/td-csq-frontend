import { Button } from '@/design/primitives/Button/Button';

import styles from './screens.module.css';

/** Three-dot loader while Keycloak and /me resolve. */
export function LoadingScreen({ label = 'Signing you in' }: { label?: string }) {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <div className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className={styles.loadingText}>{label}</p>
    </div>
  );
}

export function NoAccountScreen({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>CSQ</p>
        <h1 className={styles.title}>No CSQ account for this sign-in</h1>
        <p className={styles.text}>
          {email ? (
            <>
              You signed in as <code className={styles.code}>{email}</code>, but no CSQ account is linked to it yet.
            </>
          ) : (
            'You signed in, but no CSQ account is linked to this identity yet.'
          )}{' '}
          Ask your organisation&rsquo;s administrator or ACFI to invite you, then sign in again.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, requestId, onRetry, onSignOut }: { message: string; requestId?: string; onRetry: () => void; onSignOut: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.card} role="alert">
        <p className={styles.eyebrow}>CSQ</p>
        <h1 className={styles.title}>Could not load your account</h1>
        <p className={styles.text}>{message}</p>
        {requestId ? (
          <p className={styles.requestId}>
            Request <code className={styles.code}>{requestId}</code>
          </p>
        ) : null}
        <div className={styles.actions}>
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
          <Button variant="ghost" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
