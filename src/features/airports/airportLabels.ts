import { REGIONS } from '@/api/airports.types';
import { type SelectOption } from '@/design/primitives';

/* Option lists and small formatters for the airports area. */

export const REGION_FILTER_OPTIONS: SelectOption[] = [{ value: '', label: 'All regions' }, ...REGIONS.map((r) => ({ value: r, label: r }))];

export const REGION_OPTIONS: SelectOption[] = REGIONS.map((r) => ({ value: r, label: r }));

export const ACTIVE_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Active and inactive' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

/** "28.5562, 77.1000" — four decimals is ~10 m, enough for a master record. */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
