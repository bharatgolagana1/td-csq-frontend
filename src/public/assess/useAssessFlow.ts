import { useCallback, useMemo, useState } from 'react';

import { isApiError } from '@/api/client';
import { useInvitation } from '@/api/publicAssess';
import { type LinkSession, type PublicInvitation } from '@/api/publicAssess.types';

import { clearLinkSession, readLinkSession, writeLinkSession } from './linkSession';

/* The /assess/:token state machine (ARCHITECTURE §6). The invitation query
   decides the opening state; the participant's actions move it forward; any
   transport error on the way is routed back through `routeFlowError`. */

export type AssessPhase =
  | { kind: 'loading' }
  | { kind: 'landing'; note?: 'session-ended' }
  | { kind: 'otp'; devOtp?: string }
  | { kind: 'form'; session: LinkSession; resumed: boolean }
  | { kind: 'done'; submittedAt: string }
  | { kind: 'expired' }
  | { kind: 'submitted'; submittedAt?: string | null }
  | { kind: 'revoked' }
  | { kind: 'notFound' }
  | { kind: 'error'; error: unknown };

export type AssessActions = {
  codeSent: (devOtp?: string) => void;
  verified: (session: LinkSession) => void;
  submitted: (submittedAt: string) => void;
  sessionEnded: () => void;
  expired: () => void;
  alreadySubmitted: (submittedAt?: string | null) => void;
  revoked: () => void;
  retry: () => void;
};

/** Pure: the opening state for an invitation (or its error) and a possibly resumed session. */
export function phaseFromInvitation(
  state: { data: PublicInvitation | undefined; error: unknown; isPending: boolean },
  session: LinkSession | null,
): AssessPhase {
  if (state.error) {
    if (isApiError(state.error, 'NOT_FOUND') || (isApiError(state.error) && state.error.status === 404)) return { kind: 'notFound' };
    if (isApiError(state.error, 'LINK_EXPIRED') || (isApiError(state.error) && state.error.status === 410)) return { kind: 'expired' };
    return { kind: 'error', error: state.error };
  }
  if (state.isPending || !state.data) return { kind: 'loading' };
  const inv = state.data;
  switch (inv.state) {
    case 'EXPIRED':
      return { kind: 'expired' };
    case 'SUBMITTED':
      return { kind: 'submitted', submittedAt: inv.submittedAt ?? null };
    case 'REVOKED':
      return { kind: 'revoked' };
    default:
      return session ? { kind: 'form', session, resumed: true } : { kind: 'landing' };
  }
}

/** The backend says "already submitted" with PRECONDITION_FAILED (412) on answers/submit; a CONFLICT (409) means the same. */
function saysAlreadySubmitted(error: { code: string; status: number; message: string }): boolean {
  if (error.code === 'CONFLICT' || error.status === 409) return true;
  return (error.code === 'PRECONDITION_FAILED' || error.status === 412) && /already submitted/i.test(error.message);
}

/**
 * Maps a transport error from the form phase onto the machine. Returns true
 * when it moved the flow (session gone → landing, link dead → expired,
 * already submitted → submitted, invitation gone → revoked); false leaves the
 * caller to show it inline.
 */
export function routeFlowError(error: unknown, actions: Pick<AssessActions, 'sessionEnded' | 'expired' | 'alreadySubmitted' | 'revoked'>): boolean {
  if (!isApiError(error)) return false;
  if (error.code === 'UNAUTHENTICATED' || error.status === 401) {
    actions.sessionEnded();
    return true;
  }
  if (error.code === 'LINK_EXPIRED' || error.status === 410) {
    actions.expired();
    return true;
  }
  if (saysAlreadySubmitted(error)) {
    actions.alreadySubmitted(null);
    return true;
  }
  if (error.code === 'NOT_FOUND' || error.status === 404) {
    actions.revoked();
    return true;
  }
  return false;
}

export function useAssessFlow(token: string): { phase: AssessPhase; invitation: PublicInvitation | null; actions: AssessActions } {
  const query = useInvitation(token);
  const [override, setOverride] = useState<AssessPhase | null>(null);

  const base = useMemo(
    () => phaseFromInvitation({ data: query.data, error: query.error, isPending: query.isPending }, readLinkSession(token)),
    [query.data, query.error, query.isPending, token],
  );

  const { refetch } = query;
  const retry = useCallback(() => {
    setOverride(null);
    void refetch();
  }, [refetch]);

  const actions = useMemo<AssessActions>(
    () => ({
      codeSent: (devOtp) => setOverride({ kind: 'otp', devOtp }),
      verified: (session) => {
        writeLinkSession(token, session);
        setOverride({ kind: 'form', session, resumed: false });
      },
      submitted: (submittedAt) => {
        clearLinkSession(token);
        setOverride({ kind: 'done', submittedAt });
      },
      sessionEnded: () => {
        clearLinkSession(token);
        setOverride({ kind: 'landing', note: 'session-ended' });
      },
      expired: () => {
        clearLinkSession(token);
        setOverride({ kind: 'expired' });
      },
      alreadySubmitted: (submittedAt) => {
        clearLinkSession(token);
        setOverride({ kind: 'submitted', submittedAt });
      },
      revoked: () => {
        clearLinkSession(token);
        setOverride({ kind: 'revoked' });
      },
      retry,
    }),
    [token, retry],
  );

  return { phase: override ?? base, invitation: query.data ?? null, actions };
}
