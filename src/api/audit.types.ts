import { type ListQuery } from './types';

/* Mirrors td-csq-backend/src/modules/audit/audit.schemas.ts. */

/** GET /audit rows. `before`/`after` are whatever the writing module recorded (usually the DTO). */
export type AuditEntry = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  /** The actor's active organisation at the time. */
  actorOrgId: string | null;
  /** The organisation the entry concerns; tenancy filters use it. */
  orgId: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip: string;
  requestId: string;
  at: string;
};

export type AuditListQuery = ListQuery & {
  entity?: string;
  entityId?: string;
  orgId?: string;
  /** Actor e-mail (contains) or user id (exact). */
  actor?: string;
  action?: string;
  /** ISO instants. */
  from?: string;
  to?: string;
};

/** Actions declared in the backend contract §7 plus those the modules write today. */
export const AUDIT_ACTIONS = [
  'airport.created',
  'airport.updated',
  'airport.imported',
  'registration.submitted',
  'registration.approved',
  'registration.rejected',
  'operator.created',
  'operator.updated',
  'operator.deactivated',
  'marketshare.updated',
  'survey.published',
  'cycle.created',
  'cycle.updated',
  'cycle.published',
  'cycle.transitioned',
  'customer.created',
  'customer.updated',
  'customer.deactivated',
  'customer.imported',
  'sample.selection.changed',
  'sample.locked',
  'sample.unlocked',
  'invitation.sent',
  'invitation.resent',
  'invitation.revoked',
  'assessment.submitted',
  'scoring.run',
  'role.created',
  'role.updated',
  'roles.matrix.saved',
  'user.created',
  'user.updated',
  'settings.updated',
  'notification.resent',
] as const;

/** Entity names the modules write today (`entity` is an exact-match filter). */
export const AUDIT_ENTITIES = [
  'airport',
  'airport.marketshare',
  'assessment',
  'customer',
  'customer_import',
  'cycle',
  'invitation',
  'notification',
  'operator',
  'registration',
  'role',
  'roles.matrix',
  'sample',
  'scoring',
  'settings',
  'survey',
  'user',
] as const;
