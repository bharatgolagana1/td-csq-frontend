/* Hand-written mirrors of the invitations module (td-csq-backend §5 `invitations`,
   §6 "invitations"; src/modules/invitations/invitations.schemas.ts, domain/states.ts). */

import { type CustomerType } from './customers.types';
import { type SurveyType } from './sampling.types';
import { type ListQuery } from './types';

export type InvitationState = 'PENDING' | 'SENT' | 'OPENED' | 'VERIFIED' | 'SUBMITTED' | 'EXPIRED' | 'REVOKED';

export const INVITATION_STATES: readonly InvitationState[] = ['PENDING', 'SENT', 'OPENED', 'VERIFIED', 'SUBMITTED', 'EXPIRED', 'REVOKED'];

/** States from which the participant can still act (not submitted, expired or revoked). */
export function isLiveInvitation(state: InvitationState): boolean {
  return state === 'PENDING' || state === 'SENT' || state === 'OPENED' || state === 'VERIFIED';
}

/** RESEND is allowed from every live state and from EXPIRED (after the window was extended). */
export function canResendInvitation(state: InvitationState): boolean {
  return isLiveInvitation(state) || state === 'EXPIRED';
}

/** REVOKE is allowed from every live state. */
export function canRevokeInvitation(state: InvitationState): boolean {
  return isLiveInvitation(state);
}

/** GET /invitations rows — the operator-facing view: the participant's identity stays masked. */
export type Invitation = {
  id: string;
  cycleId: string;
  acoId: string;
  airportId: string | null;
  customerId: string;
  assessmentId: string | null;
  surveyType: SurveyType;
  state: InvitationState;
  emailMasked: string;
  customer: { nameMasked: string; type: CustomerType };
  sentAt: string | null;
  openedAt: string | null;
  verifiedAt: string | null;
  submittedAt: string | null;
  revokedAt: string | null;
  expiresAt: string;
  remindersSent: number;
  lastReminderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvitationListQuery = ListQuery & {
  cycleId: string;
  acoId?: string;
  state?: InvitationState;
  surveyType?: SurveyType;
};
