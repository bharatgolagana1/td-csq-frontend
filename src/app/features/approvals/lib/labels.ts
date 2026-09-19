import type {
  ApprovalMode,
  ApprovalStatus,
  CompanyType,
  RejectCode,
  TerminalScope,
  ViewerRole,
} from '../api/approvals.types';

export const STATUS_META: Record<ApprovalStatus, { label: string; colour: string; bg: string }> = {
  AWAITING_REVIEW: { label: 'Awaiting review', colour: 'var(--csq-ink-2)', bg: 'var(--csq-surface-2)' },
  APPROVED: { label: 'Approved', colour: 'var(--csq-r5)', bg: 'rgba(15,122,99,.10)' },
  AUTO_APPROVED: { label: 'Auto approved', colour: 'var(--csq-r2)', bg: 'rgba(200,135,60,.12)' },
  REJECTED: { label: 'Rejected', colour: 'var(--csq-r1)', bg: 'rgba(180,84,60,.12)' },
};

export const COMPANY_TYPE_LABEL: Record<CompanyType, string> = {
  FREIGHT_FORWARDER: 'Freight forwarder',
  CUSTOMS_BROKER: 'Customs broker',
  SHIPPER: 'Shipper',
  AIRLINE: 'Airline',
};

export const SCOPE_LABEL: Record<TerminalScope, string> = {
  INTERNATIONAL: 'International',
  DOMESTIC: 'Domestic',
};

/** The two directions every question is answered in, which differ by terminal kind. */
export const SCOPE_DIRECTIONS: Record<TerminalScope, string> = {
  INTERNATIONAL: 'Export and Import',
  DOMESTIC: 'Inbound and Outbound',
};

export const APPROVAL_MODE_LABEL: Record<ApprovalMode, string> = {
  AUTOMATIC: 'Automatic approval',
  REQUIRES_REVIEW: 'Requires review',
};

export const APPROVAL_MODE_HELP: Record<ApprovalMode, string> = {
  AUTOMATIC:
    'Locked batches from this operator go straight into the cycle. Nobody at ACFI sees who was chosen before assessment opens.',
  REQUIRES_REVIEW:
    'Every locked batch from this operator waits here until a Super Admin approves it.',
};

export const REJECT_LABEL: Record<RejectCode, string> = {
  BELOW_MINIMUM: 'Fewer contacts than the cycle minimum',
  OWN_STAFF_PRESENT: 'Sample contains the operator’s own people',
  UNVERIFIABLE_CONTACTS: 'Contacts cannot be verified',
  DUPLICATE_CONTACTS: 'Same person listed more than once',
  SAMPLE_NOT_REPRESENTATIVE: 'Sample is not representative of the customer base',
  OTHER: 'Other, set out in the message',
};

export const ROLE_LABEL: Record<ViewerRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ACFI_STAFF: 'ACFI staff',
  OPERATOR: 'Cargo handling operator',
  ASSESSOR: 'Assessor',
};
