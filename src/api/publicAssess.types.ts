/* Public participant flow — hand-written mirrors of
   td-csq-backend/docs/ARCHITECTURE.md §6 "public participant flow" and the zod
   schemas in src/modules/invitations/invitations.schemas.ts (participantStatus,
   otp, verify) and src/modules/assessments/assessments.schemas.ts (form, draft,
   answers, readiness). The form and answer shapes are the same wire objects the
   signed-in self-assessment uses, so they come from `assessments.types`. */

import {
  type Answer,
  type AnswerInput,
  type AssessmentForm,
  type AssessmentFormResponse,
  type AssessmentSummary,
  type CustomerType,
  type Draft,
  type PatchAnswersResult,
  type Progress,
  type Readiness,
  type SurveyType,
} from './assessments.types';

export type { Answer, AnswerInput, AssessmentForm, AssessmentFormResponse, AssessmentSummary, CustomerType, Draft, PatchAnswersResult, Progress, Readiness, SurveyType };

export type InvitationState = 'PENDING' | 'SENT' | 'OPENED' | 'VERIFIED' | 'SUBMITTED' | 'EXPIRED' | 'REVOKED';

/** `GET /public/assess/:token` (invitations.schemas `participantStatusResponse`); 404 when the token is unknown. */
export type PublicInvitation = {
  state: InvitationState;
  cycle: {
    id?: string;
    name: string;
    /** ISO instant of `assessment.end`; the link dies at this moment. */
    assessmentEnd: string;
    /** IANA zone the cycle was entered in. Not in the backend schema yet (assumption to confirm); falls back to Asia/Kolkata. */
    tz?: string;
  };
  operator: {
    name: string;
    /** Nullable on the wire: an operator without an airport record. */
    airport: { iata: string; name: string } | null;
  };
  surveyType: SurveyType;
  customer: {
    nameMasked: string;
    emailMasked: string;
    /** Not in the backend schema (assumption to confirm); shown as "Freight forwarder / Customs broker" when present. */
    type?: CustomerType;
  };
  submittedAt: string | null;
  /** Same instant as `cycle.assessmentEnd` unless the window was extended. */
  expiresAt?: string;
};

/** `POST /public/assess/:token/otp` (`otpResponse`). `devOtp` only with DEMO_REVEAL_OTP=true. */
export type OtpSent = { sent: true; expiresAt?: string; devOtp?: string };

/** `POST /public/assess/:token/verify` (`verifyResponse`) → the link session sent back as `x-csq-link-token`. */
export type LinkSession = { sessionToken: string; expiresAt: string; assessmentId?: string };

/** `OTP_INVALID` details as the OTP policy reports them (assumed to be forwarded by the handler). */
export type OtpInvalidDetails = { attemptsLeft?: number; locked?: boolean };

/** `RATE_LIMITED` details (resend cap 3 per 10 min, cooldown 30 s). */
export type RateLimitedDetails = { retryAfterMs?: number; reason?: 'COOLDOWN' | 'RATE_LIMITED' };

/** `POST /public/assess/:token/submit` → the locked assessment (`assessmentResponse`). */
export type SubmitResult = AssessmentSummary;
