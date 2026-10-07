import { type Operations } from '@/api/operators.types';
import { type SelectOption } from '@/design/primitives';

/* Option lists and formatters for the operators area. */

export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export const DETAIL_TABS = ['overview', 'members', 'shares', 'customers'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

export function isDetailTab(value: string | null): value is DetailTab {
  return (DETAIL_TABS as readonly string[]).includes(value ?? '');
}

/** "Domestic · International", "Domestic", or "—". */
export function operationsLabel(o: Operations): string {
  const parts = [o.domestic ? 'Domestic' : null, o.international ? 'International' : null].filter((p): p is string => p !== null);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function createdViaLabel(via: 'ADMIN' | 'LINK'): string {
  return via === 'LINK' ? 'Self-registration link' : 'Added by ACFI';
}
