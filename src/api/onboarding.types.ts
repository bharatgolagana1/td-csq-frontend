import { type MarketShareEntry } from './marketshare.types';
import { type Address, type AirportRef, type Contact, type Operations } from './operators.types';

/* onboarding module (td-csq-backend/src/modules/onboarding/onboarding.schemas.ts; §6 "onboarding", §7 "Onboarding"). */

export type LinkOrgType = 'ACO' | 'AIRPORT';

/** Derived on the server from `usedAt` / `expiresAt`. */
export type LinkStatus = 'OPEN' | 'USED' | 'EXPIRED';

/** GET /onboarding/links rows. The raw token is never returned here. */
export type OnboardingLink = {
  id: string;
  orgType: LinkOrgType;
  airport: AirportRef | null;
  createdBy: { id: string; name: string; email: string } | null;
  expiresAt: string;
  usedAt: string | null;
  registrationId: string | null;
  note: string | null;
  status: LinkStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateOnboardingLinkInput = {
  orgType: LinkOrgType;
  airportId: string;
  /** 1–90; defaults to 14 on the server. */
  expiresInDays?: number;
  note?: string;
};

/** POST /onboarding/links — the only response that carries the URL with the raw token. */
export type CreatedOnboardingLink = OnboardingLink & { url: string };

/** GET /public/onboarding/:token (404 unknown, 410 LINK_EXPIRED). */
export type PublicOnboardingLink = {
  orgType: LinkOrgType;
  airport: AirportRef | null;
  expiresAt: string;
  used: boolean;
};

/** POST /public/onboarding/:token body. */
export type RegistrationInput = {
  organisation: {
    name: string;
    legalName?: string;
    address: Address;
    contact: Contact;
  };
  admin: Contact;
  operations: Operations;
  /** ACO registrations only. */
  marketSharePct?: number;
};

export type RegistrationStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

/** "Same shape as organisations minus status" (§5 registrations). */
export type RegistrationOrganisation = {
  name: string;
  legalName: string | null;
  address: Address;
  contact: Contact;
};

/** GET /registrations rows. */
export type Registration = {
  id: string;
  linkId: string | null;
  orgType: LinkOrgType;
  airport: AirportRef | null;
  organisation: RegistrationOrganisation;
  operations: Operations;
  admin: Contact;
  marketSharePct: number | null;
  status: RegistrationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  resultOrgId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * The airport's current share set for the reviewer. `projectedTotal` is the
 * total after approving a SUBMITTED registration as requested.
 */
export type RegistrationMarketShare = {
  entries: MarketShareEntry[];
  total: number;
  projectedTotal: number;
};

/** GET /registrations/:id and the approve/reject responses. Null share for AIRPORT registrations. */
export type RegistrationDetail = Registration & { marketShare: RegistrationMarketShare | null };

export type ApproveRegistrationInput = {
  code: string;
  /** Overrides the requested share (ACO only). */
  marketSharePct?: number;
  note?: string;
};

export type RejectRegistrationInput = { note: string };
