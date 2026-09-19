import type {
  ChangeKind,
  ChangeReason,
  ContactChange,
  FieldChange,
  SampledContact,
} from '../api/approvals.types';
import { recomputeFlags, type IntegrityContext } from './integrity';

export const REASON_LABEL: Record<ChangeReason, string> = {
  OWN_STAFF: 'Works for the operator',
  DUPLICATE: 'Duplicate of another contact',
  NOT_A_CUSTOMER: 'No trade relationship with this terminal',
  INVALID_CONTACT: 'Contact details do not reach anyone',
  OPERATOR_REQUEST: 'Requested by the operator',
  COVERAGE_SHORTFALL: 'Sample was below the minimum',
  BROADEN_SAMPLE: 'Broadens a narrow sample',
  TYPO_CORRECTION: 'Corrected a typing error',
  VERIFIED_UPDATE: 'Updated against verified details',
  OTHER: 'Other, explained in the note',
};

/** Reasons that can honestly be given for each kind of change. */
export const REASONS_FOR: Record<ChangeKind, ChangeReason[]> = {
  REMOVE: ['OWN_STAFF', 'DUPLICATE', 'NOT_A_CUSTOMER', 'INVALID_CONTACT', 'OPERATOR_REQUEST', 'OTHER'],
  ADD: ['COVERAGE_SHORTFALL', 'BROADEN_SAMPLE', 'OPERATOR_REQUEST', 'OTHER'],
  EDIT: ['TYPO_CORRECTION', 'VERIFIED_UPDATE', 'OPERATOR_REQUEST', 'OTHER'],
};

export const CHANGE_KIND_LABEL: Record<ChangeKind, string> = {
  ADD: 'Added',
  REMOVE: 'Removed',
  EDIT: 'Corrected',
};

interface EditableField {
  key: keyof SampledContact;
  label: string;
}

const EDITABLE_FIELDS: EditableField[] = [
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'company', label: 'Company' },
  { key: 'companyType', label: 'Company type' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
];

/** Always diffed against what the operator submitted, never against the last edit. */
export function diffFields(original: SampledContact, updated: SampledContact): FieldChange[] {
  const out: FieldChange[] = [];
  for (const f of EDITABLE_FIELDS) {
    const from = String(original[f.key] ?? '');
    const to = String(updated[f.key] ?? '');
    if (from !== to) out.push({ field: String(f.key), label: f.label, from, to });
  }
  return out;
}

/**
 * The working sample is always the submitted batch plus the pending changes,
 * never a separately mutated list. Undo is then just dropping a change.
 */
export function applyChanges(
  submitted: SampledContact[],
  changes: ContactChange[],
  ctx: IntegrityContext,
): SampledContact[] {
  const removed = new Set<string>();
  const edited = new Map<string, SampledContact>();
  const added: SampledContact[] = [];

  for (const change of changes) {
    if (change.kind === 'REMOVE') removed.add(change.contactId);
    else if (change.kind === 'EDIT') edited.set(change.contactId, change.contact);
    else added.push(change.contact);
  }

  const working = submitted
    .filter((c) => !removed.has(c.id))
    .map((c) => edited.get(c.id) ?? c)
    .concat(added.filter((c) => !removed.has(c.id)));

  return recomputeFlags(working, ctx);
}

export interface ChangeSummary {
  added: number;
  removed: number;
  edited: number;
  total: number;
}

export function summariseChanges(changes: ContactChange[]): ChangeSummary {
  const summary: ChangeSummary = { added: 0, removed: 0, edited: 0, total: changes.length };
  for (const c of changes) {
    if (c.kind === 'ADD') summary.added += 1;
    else if (c.kind === 'REMOVE') summary.removed += 1;
    else summary.edited += 1;
  }
  return summary;
}

let sequence = 0;

export function nextLocalId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

export function changeToAuditAction(change: ContactChange): string {
  const who = `${change.contact.name} (${change.contact.company})`;
  if (change.kind === 'ADD') return `Added ${who} to the sample`;
  if (change.kind === 'REMOVE') return `Removed ${who} from the sample`;
  const fields = (change.fields ?? []).map((f) => f.label.toLowerCase()).join(', ');
  return `Corrected ${fields || 'details'} for ${who}`;
}
