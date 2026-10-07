import { type CustomerStatus, type CustomerSurveyType, type CustomerType } from '@/api/customers.types';
import { type PillVariant, type SelectOption } from '@/design/primitives';

/* Labels and pill variants for the FF / CB directory (REQUIREMENTS §7). */

export const TYPE_LABELS: Record<CustomerType, string> = { FF: 'Freight forwarder', CB: 'Customs broker' };
export const SURVEY_LABELS: Record<CustomerSurveyType, string> = { DOMESTIC: 'Domestic', INTERNATIONAL: 'International', BOTH: 'Both' };
export const STATUS_LABELS: Record<CustomerStatus, string> = { ACTIVE: 'Active', INACTIVE: 'Inactive' };

export function typeVariant(type: CustomerType): PillVariant {
  return type === 'FF' ? 'info' : 'neutral';
}

export function surveyVariant(surveyType: CustomerSurveyType): PillVariant {
  return surveyType === 'BOTH' ? 'success' : surveyType === 'INTERNATIONAL' ? 'info' : 'neutral';
}

export const TYPE_OPTIONS: SelectOption[] = [
  { value: 'FF', label: 'FF · Freight forwarder' },
  { value: 'CB', label: 'CB · Customs broker' },
];

export const SURVEY_OPTIONS: SelectOption[] = [
  { value: 'DOMESTIC', label: 'Domestic' },
  { value: 'INTERNATIONAL', label: 'International' },
  { value: 'BOTH', label: 'Both' },
];

export const TYPE_FILTER_OPTIONS: SelectOption[] = [{ value: '', label: 'All types' }, { value: 'FF', label: 'FF' }, { value: 'CB', label: 'CB' }];
export const SURVEY_FILTER_OPTIONS: SelectOption[] = [{ value: '', label: 'All survey types' }, ...SURVEY_OPTIONS];
export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];
