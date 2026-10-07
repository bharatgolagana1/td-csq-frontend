import { type ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Skeleton } from '@/design/primitives';

import styles from './assess.module.css';
import { AssessClosed } from './AssessClosed';
import { AssessDone } from './AssessDone';
import { AssessForm } from './AssessForm';
import { AssessLanding } from './AssessLanding';
import { OtpScreen } from './OtpScreen';
import { type FlowStep, PublicFrame } from './PublicFrame';
import { type AssessPhase, useAssessFlow } from './useAssessFlow';

function stepFor(phase: AssessPhase): FlowStep | null {
  switch (phase.kind) {
    case 'loading':
    case 'landing':
      return 0;
    case 'otp':
      return 1;
    case 'form':
      return 2;
    case 'done':
      return 3;
    default:
      return null;
  }
}

function LoadingCard() {
  return (
    <section className={styles.card} aria-busy="true" aria-label="Loading your invitation">
      <div className={styles.skeletonStack}>
        <Skeleton width="45%" height={12} />
        <Skeleton width="80%" height={28} />
        <Skeleton width="55%" height={14} />
        <Skeleton lines={3} />
        <Skeleton height={44} radius={6} />
      </div>
    </section>
  );
}

/** /assess/:token — landing → otp → form → done, plus the calm closed states. No shell, no sign-in. */
function AssessFlow({ token }: { token: string }) {
  const { phase, invitation, actions } = useAssessFlow(token);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const previous = document.title;
    document.title = invitation ? `Rate ${invitation.operator.name} · CSQ` : 'Assessment · CSQ';
    return () => {
      document.title = previous;
    };
  }, [invitation]);

  let screen: ReactNode;
  switch (phase.kind) {
    case 'loading':
      screen = <LoadingCard />;
      break;
    case 'landing':
      screen = invitation ? <AssessLanding token={token} invitation={invitation} note={phase.note} onCodeSent={actions.codeSent} onExpired={actions.expired} /> : <LoadingCard />;
      break;
    case 'otp':
      screen = invitation ? <OtpScreen token={token} invitation={invitation} devOtp={phase.devOtp} onVerified={actions.verified} onExpired={actions.expired} /> : <LoadingCard />;
      break;
    case 'form':
      screen = invitation ? <AssessForm token={token} session={phase.session} invitation={invitation} resumed={phase.resumed} actions={actions} onProgress={setProgress} /> : <LoadingCard />;
      break;
    case 'done':
      screen = invitation ? <AssessDone invitation={invitation} submittedAt={phase.submittedAt} /> : <LoadingCard />;
      break;
    case 'submitted':
      screen = <AssessClosed variant="submitted" invitation={invitation} submittedAt={phase.submittedAt} />;
      break;
    case 'expired':
      screen = <AssessClosed variant="expired" invitation={invitation} />;
      break;
    case 'revoked':
      screen = <AssessClosed variant="revoked" invitation={invitation} />;
      break;
    case 'notFound':
      screen = <AssessClosed variant="notFound" />;
      break;
    case 'error':
      screen = <AssessClosed variant="error" error={phase.error} onRetry={actions.retry} />;
      break;
  }

  return (
    <PublicFrame step={stepFor(phase)} stepProgress={progress} wide={phase.kind === 'form'}>
      {screen}
    </PublicFrame>
  );
}

export default function AssessPage() {
  const { token = '' } = useParams<{ token: string }>();
  // Keyed by token: a new link starts the machine afresh.
  return <AssessFlow key={token} token={token} />;
}
