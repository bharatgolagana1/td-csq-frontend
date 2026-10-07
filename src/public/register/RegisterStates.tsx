import { type ReactNode } from 'react';

import { Icon, type IconName } from '@/design/icons';
import { Button, Skeleton } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './register.module.css';

function State({ icon, title, children, muted, action, reference }: { icon: IconName; title: string; children: ReactNode; muted?: boolean; action?: ReactNode; reference?: string }) {
  return (
    <div className={cn(styles.card, styles.state, muted && styles.stateMuted)} role="status">
      <span className={styles.stateIcon} aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.stateText}>{children}</p>
      {action}
      {reference ? <code className={styles.ref}>{reference}</code> : null}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className={styles.card} aria-busy="true">
      <div className={styles.skeletonStack}>
        <Skeleton width={120} height={12} />
        <Skeleton width="70%" height={24} />
        <Skeleton lines={3} />
      </div>
      <span role="status" className="visually-hidden">
        Checking your link
      </span>
    </div>
  );
}

export function InvalidLinkState() {
  return (
    <State icon="warning" title="This link isn’t valid" muted>
      Check that you opened the full link from the e-mail. If it still does not work, ask ACFI for a new one.
    </State>
  );
}

export function ExpiredLinkState() {
  return (
    <State icon="clock" title="This link has expired" muted>
      Onboarding links are valid for a limited time. Ask ACFI for a fresh link and you can register in a few minutes.
    </State>
  );
}

export function UsedLinkState() {
  return (
    <State icon="check" title="Already registered">
      A registration has already been submitted with this link. ACFI will review it and e-mail the administrator once access is granted.
    </State>
  );
}

export function ErrorState({ message, requestId, onRetry }: { message: string; requestId?: string; onRetry: () => void }) {
  return (
    <State
      icon="warning"
      title="Could not check your link"
      muted
      action={
        <Button variant="primary" size="lg" onClick={onRetry}>
          Try again
        </Button>
      }
      reference={requestId ? `Request ${requestId}` : undefined}
    >
      {message}
    </State>
  );
}

export function DoneState({ orgName, adminEmail, registrationId }: { orgName: string; adminEmail: string; registrationId: string }) {
  return (
    <State icon="check" title="Request received" reference={`Reference ${registrationId}`}>
      Thank you. ACFI will review the registration for {orgName}. Once it is approved, {adminEmail} receives an e-mail with a link to set a password and sign in.
    </State>
  );
}
