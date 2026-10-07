import { describe, expect, it } from 'vitest';

import { type AuditEntry } from '@/api/audit.types';

import { AUDIT_CSV_COLUMNS, auditCsv, auditCsvFilename, auditCsvRows } from './auditCsv';

const ENTRY: AuditEntry = {
  id: 'a1',
  actorUserId: 'u1',
  actorEmail: 'anita@acfi.example',
  actorOrgId: 'org-acfi',
  orgId: 'org-csc',
  action: 'sample.locked',
  entity: 'sample',
  entityId: 'cp-9',
  before: { status: 'IN_PROGRESS' },
  after: { status: 'LOCKED', note: 'says "done", ok' },
  ip: '10.0.0.7',
  requestId: 'req_12',
  at: '2026-10-07T09:00:00.000Z',
};

describe('auditCsv', () => {
  it('maps entries to the REQUIREMENTS §26 columns with resolved organisation names', () => {
    const [row] = auditCsvRows([ENTRY], (id) => (id === 'org-csc' ? 'Cargo Service Center' : undefined));
    expect(row).toMatchObject({ at: ENTRY.at, actorEmail: 'anita@acfi.example', organisation: 'Cargo Service Center', orgId: 'org-csc', action: 'sample.locked', entityId: 'cp-9', ip: '10.0.0.7', requestId: 'req_12' });
    expect(row?.before).toBe('{"status":"IN_PROGRESS"}');
  });

  it('writes a header row and escapes JSON cells', () => {
    const csv = auditCsv([ENTRY]);
    const [header, line] = csv.split('\r\n');
    expect(header).toBe(AUDIT_CSV_COLUMNS.join(','));
    expect(line).toContain('"{""status"":""LOCKED"",""note"":""says \\""done\\"", ok""}"');
  });

  it('labels system actions and leaves missing snapshots empty', () => {
    const [row] = auditCsvRows([{ ...ENTRY, actorEmail: null, actorUserId: null, orgId: null, before: undefined, after: undefined }]);
    expect(row).toMatchObject({ actorEmail: 'system', actorUserId: '', organisation: '', orgId: '', before: '', after: '' });
  });

  it('names the file by the local date and time', () => {
    expect(auditCsvFilename(new Date(2026, 9, 7, 14, 5))).toBe('audit-2026-10-07-1405.csv');
  });
});
