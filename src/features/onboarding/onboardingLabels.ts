import { type LinkOrgType, type LinkStatus } from '@/api/onboarding.types';
import { type PillVariant, type SelectOption } from '@/design/primitives';

/* Option lists and labels for the onboarding area. */

export const ORG_TYPE_LABEL: Record<LinkOrgType, string> = { ACO: 'Operator', AIRPORT: 'Airport organisation' };

export const ORG_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'All types' },
  { value: 'ACO', label: 'Operators' },
  { value: 'AIRPORT', label: 'Airport organisations' },
];

export const LINK_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All links' },
  { value: 'OPEN', label: 'Open' },
  { value: 'USED', label: 'Used' },
  { value: 'EXPIRED', label: 'Expired' },
];

export const REGISTRATION_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All requests' },
  { value: 'SUBMITTED', label: 'Awaiting review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function linkStatusVariant(status: LinkStatus): PillVariant {
  return status === 'OPEN' ? 'info' : status === 'USED' ? 'success' : 'neutral';
}

export function linkStatusLabel(status: LinkStatus): string {
  return status === 'OPEN' ? 'Open' : status === 'USED' ? 'Used' : 'Expired';
}

export function registrationStatusLabel(status: 'SUBMITTED' | 'APPROVED' | 'REJECTED'): string {
  return status === 'SUBMITTED' ? 'Awaiting review' : status === 'APPROVED' ? 'Approved' : 'Rejected';
}

export function registrationStatusVariant(status: 'SUBMITTED' | 'APPROVED' | 'REJECTED'): PillVariant {
  return status === 'SUBMITTED' ? 'info' : status === 'APPROVED' ? 'success' : 'danger';
}
