import Papa from 'papaparse';

import { type AuditEntry } from '@/api/audit.types';

/* Client-side CSV of the filtered audit view (REQUIREMENTS §26 columns: user,
   organisation, action, date and time, previous value, new value, IP). The
   snapshots are serialised as JSON in one cell each so nothing is lost. */

export const AUDIT_CSV_COLUMNS = ['at', 'actorEmail', 'actorUserId', 'organisation', 'orgId', 'action', 'entity', 'entityId', 'before', 'after', 'ip', 'requestId'] as const;

export type OrgNameLookup = (id: string) => string | undefined;

export function auditCsvRows(entries: AuditEntry[], orgName: OrgNameLookup = () => undefined): Record<(typeof AUDIT_CSV_COLUMNS)[number], string>[] {
  return entries.map((e) => ({
    at: e.at,
    actorEmail: e.actorEmail ?? 'system',
    actorUserId: e.actorUserId ?? '',
    organisation: e.orgId ? (orgName(e.orgId) ?? '') : '',
    orgId: e.orgId ?? '',
    action: e.action,
    entity: e.entity,
    entityId: e.entityId,
    before: e.before === undefined ? '' : JSON.stringify(e.before),
    after: e.after === undefined ? '' : JSON.stringify(e.after),
    ip: e.ip,
    requestId: e.requestId,
  }));
}

export function auditCsv(entries: AuditEntry[], orgName?: OrgNameLookup): string {
  return Papa.unparse({ fields: [...AUDIT_CSV_COLUMNS], data: auditCsvRows(entries, orgName).map((r) => AUDIT_CSV_COLUMNS.map((c) => r[c])) }, { newline: '\r\n' });
}

/** "audit-2026-10-07-1430.csv" */
export function auditCsvFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `audit-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
}

/** Triggers a browser download of UTF-8 text (with BOM so spreadsheets read the encoding). */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8'): void {
  const blob = new Blob(['﻿', text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
