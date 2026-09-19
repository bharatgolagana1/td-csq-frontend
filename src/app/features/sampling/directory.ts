import type { Customer, CustomerType, FormScope } from './api/sampling.types';
import { SCOPE_LABEL, TYPE_LABEL } from './api/sampling.logic';

export type SortKey = 'name' | 'company' | 'email' | 'phone' | 'type' | 'scope' | 'lastSampledAt';
export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

export interface DirectoryFilters {
  query: string;
  type: CustomerType | 'ALL';
  scope: FormScope | 'ALL';
  onlySelected: boolean;
  /** Set by an integrity signal, to show only the contacts it names. */
  restrictToIds: string[] | null;
}

export const EMPTY_FILTERS: DirectoryFilters = {
  query: '',
  type: 'ALL',
  scope: 'ALL',
  onlySelected: false,
  restrictToIds: null,
};

export function hasActiveFilters(filters: DirectoryFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.type !== 'ALL' ||
    filters.scope !== 'ALL' ||
    filters.onlySelected ||
    filters.restrictToIds !== null
  );
}

export function filterCustomers(
  customers: Customer[],
  filters: DirectoryFilters,
  selected: Set<string>,
): Customer[] {
  const query = filters.query.trim().toLowerCase();
  const restrict = filters.restrictToIds ? new Set(filters.restrictToIds) : null;

  return customers.filter((customer) => {
    if (restrict && !restrict.has(customer.id)) return false;
    if (filters.type !== 'ALL' && customer.type !== filters.type) return false;
    if (filters.scope !== 'ALL' && customer.scope !== filters.scope) return false;
    if (filters.onlySelected && !selected.has(customer.id)) return false;
    if (!query) return true;
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.company.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query)
    );
  });
}

function sortValue(customer: Customer, key: SortKey): string {
  switch (key) {
    case 'type':
      return TYPE_LABEL[customer.type];
    case 'scope':
      return SCOPE_LABEL[customer.scope];
    case 'lastSampledAt':
      // Never sampled sorts as the earliest possible date rather than as text,
      // so "who have we not asked yet" is one click on the column.
      return customer.lastSampledAt ?? '';
    default:
      return customer[key];
  }
}

export function sortCustomers(customers: Customer[], sort: SortState): Customer[] {
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...customers].sort((a, b) => {
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);
    const compared = left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' });
    return compared !== 0 ? compared * factor : a.name.localeCompare(b.name, 'en');
  });
}
