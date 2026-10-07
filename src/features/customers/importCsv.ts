import Papa from 'papaparse';

import { type ImportError } from '@/api/customers.types';

/* Small CSV helpers for the bulk-import stepper. */

export const TEMPLATE_FILE_NAME = 'customers-template.csv';

/** The template's columns, in order, with what the operator should put in each. */
export const TEMPLATE_COLUMNS: { key: string; header: string; required: boolean; help: string }[] = [
  { key: 'name', header: 'Name', required: true, help: 'Organisation name' },
  { key: 'contactPerson', header: 'Contact person', required: false, help: 'Defaults to the organisation name' },
  { key: 'email', header: 'Email', required: true, help: 'One per customer; the key on re-import' },
  { key: 'phone', header: 'Phone', required: true, help: '10-digit Indian mobile or +country number' },
  { key: 'type', header: 'Type', required: true, help: 'FF or CB' },
  { key: 'surveyType', header: 'Survey type', required: true, help: 'DOMESTIC, INTERNATIONAL or BOTH' },
  { key: 'tags', header: 'Tags', required: false, help: 'Separated by ; or ,' },
];

/** Errors → "row,field,message" CSV for download. */
export function errorsToCsv(errors: ImportError[]): string {
  return Papa.unparse(errors.map((e) => ({ row: e.row, field: e.field, message: e.message })), { columns: ['row', 'field', 'message'] });
}

/** Saves text as a file through a temporary object URL (no-op without a DOM). */
export function saveTextFile(name: string, text: string, type = 'text/csv;charset=utf-8'): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isCsvFile(file: File): boolean {
  return /\.csv$/i.test(file.name) || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'text/plain';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
