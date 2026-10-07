import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { usePublicOnboardingLink } from '@/api/onboarding';

import { RegisterForm } from './RegisterForm';
import { RegisterFrame } from './RegisterFrame';
import { DoneState, ErrorState, ExpiredLinkState, InvalidLinkState, LoadingState, UsedLinkState } from './RegisterStates';
import { STEPS } from './registerSchema';

type Done = { registrationId: string; orgName: string; adminEmail: string };

/**
 * /register/:token — `GET /public/onboarding/:token` decides the screen:
 * 404 → invalid, 410 → expired, `used` → already registered, else the
 * stepped form; a successful POST shows the confirmation. No shell, no sign-in.
 */
export default function RegisterPage() {
  const { token } = useParams<{ token: string }>();
  const link = usePublicOnboardingLink(token);
  const [done, setDone] = useState<Done | null>(null);
  const [gone, setGone] = useState<'used' | 'expired' | null>(null);
  const [step, setStep] = useState(0);

  if (done) {
    return (
      <RegisterFrame>
        <DoneState orgName={done.orgName} adminEmail={done.adminEmail} registrationId={done.registrationId} />
      </RegisterFrame>
    );
  }
  if (gone === 'used') {
    return (
      <RegisterFrame>
        <UsedLinkState />
      </RegisterFrame>
    );
  }
  if (gone === 'expired') {
    return (
      <RegisterFrame>
        <ExpiredLinkState />
      </RegisterFrame>
    );
  }
  if (!token || link.isPending) {
    return (
      <RegisterFrame>
        <LoadingState />
      </RegisterFrame>
    );
  }
  if (link.isError) {
    const e = link.error;
    const body = isApiError(e, 'NOT_FOUND') ? <InvalidLinkState /> : isApiError(e, 'LINK_EXPIRED') || (isApiError(e) && e.status === 410) ? <ExpiredLinkState /> : <ErrorState message={errorMessage(e)} requestId={errorRequestId(e)} onRetry={() => void link.refetch()} />;
    return <RegisterFrame>{body}</RegisterFrame>;
  }
  if (link.data.used) {
    return (
      <RegisterFrame>
        <UsedLinkState />
      </RegisterFrame>
    );
  }
  return (
    <RegisterFrame status={`Step ${step + 1} of ${STEPS.length}`}>
      <RegisterForm token={token} link={link.data} onSubmitted={setDone} onLinkGone={setGone} onStepChange={setStep} />
    </RegisterFrame>
  );
}
