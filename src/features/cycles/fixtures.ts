import { type AuditEntry } from '@/api/audit.types';
import { type CycleDetail, type CycleMonitoring, type CycleParticipant, type CycleStatus, type CycleSummary, type CycleWindow } from '@/api/cycles.types';
import { type Notification } from '@/api/notifications.types';
import { type Registration } from '@/api/onboarding.types';
import { type Operator } from '@/api/operators.types';
import { type CurrentCycle } from '@/api/sampling.types';
import { type Settings } from '@/api/types';

/* Typed factories mirroring the backend DTOs, for the cycles and overview tests. */

export function window(startWall: string, endWall: string): CycleWindow {
  const utc = (wall: string) => new Date(`${wall}:00+05:30`).toISOString();
  return { start: { wall: startWall, utc: utc(startWall) }, end: { wall: endWall, utc: utc(endWall) } };
}

export function cycleSummary(over: Partial<CycleSummary> = {}): CycleSummary {
  return {
    id: 'cy1',
    code: 'CSQ-26H2',
    name: 'CSQ 2026 H2',
    type: 'BOTH',
    status: 'SAMPLING_OPEN',
    tz: 'Asia/Kolkata',
    sampling: window('2026-10-01T00:00', '2026-10-11T00:00'),
    assessment: window('2026-10-11T00:00', '2026-11-10T00:00'),
    minSampleSize: 50,
    participants: { airports: 2, operators: 3 },
    progress: { locked: 2, invited: 95, completed: 40 },
    publishedAt: '2026-09-25T06:00:00.000Z',
    scoredAt: null,
    createdAt: '2026-09-20T06:00:00.000Z',
    updatedAt: '2026-09-25T06:00:00.000Z',
    ...over,
  };
}

export function participant(over: Partial<CycleParticipant> = {}): CycleParticipant {
  return {
    id: 'cp1',
    cycleId: 'cy1',
    acoId: 'org-csc',
    airportId: 'ap-del',
    operator: { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center' },
    airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' },
    surveyTypes: ['DOMESTIC', 'INTERNATIONAL'],
    requiredSampleSize: 50,
    sampling: { status: 'LOCKED', selectedCount: 52, lockedAt: '2026-10-03T08:00:00.000Z', lockedBy: 'u2', unlockedAt: null, unlockedBy: null, unlockReason: null },
    stats: { invited: 52, started: 30, completed: 20 },
    selfAssessment: { DOMESTIC: 'NOT_STARTED', INTERNATIONAL: 'NOT_STARTED' },
    reminders: { sent: 1, lastAt: '2026-10-04T03:30:00.000Z' },
    createdAt: '2026-09-25T06:00:00.000Z',
    updatedAt: '2026-10-03T08:00:00.000Z',
    ...over,
  };
}

export function cycleDetail(over: Partial<CycleDetail> = {}, status: CycleStatus = 'SAMPLING_OPEN'): CycleDetail {
  const summary = cycleSummary({ status });
  return {
    ...summary,
    reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 10, everyDays: 2 } },
    participatingAirportIds: ['ap-del', 'ap-bom'],
    participatingAcoIds: ['org-csc', 'org-celebi', 'org-mial'],
    surveyVersions: status === 'DRAFT' ? { DOMESTIC: null, INTERNATIONAL: null } : { DOMESTIC: 'sv-dom-3', INTERNATIONAL: 'sv-int-2' },
    marketShareFrozen: status !== 'DRAFT',
    publishedBy: status === 'DRAFT' ? null : 'u1',
    createdBy: 'u1',
    participantList:
      status === 'DRAFT'
        ? []
        : [
            participant(),
            participant({
              id: 'cp2',
              acoId: 'org-celebi',
              operator: { id: 'org-celebi', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo' },
              sampling: { status: 'IN_PROGRESS', selectedCount: 37, lockedAt: null, lockedBy: null, unlockedAt: null, unlockedBy: null, unlockReason: null },
              stats: { invited: 0, started: 0, completed: 0 },
              reminders: { sent: 2, lastAt: null },
            }),
            participant({
              id: 'cp3',
              acoId: 'org-mial',
              airportId: 'ap-bom',
              operator: { id: 'org-mial', code: 'MCT-BOM', name: 'Mumbai Cargo Terminal' },
              airport: { id: 'ap-bom', iata: 'BOM', name: 'Mumbai' },
              surveyTypes: ['DOMESTIC'],
              sampling: { status: 'LOCKED', selectedCount: 50, lockedAt: '2026-10-02T08:00:00.000Z', lockedBy: 'u5', unlockedAt: null, unlockedBy: null, unlockReason: null },
              stats: { invited: 43, started: 25, completed: 20 },
              reminders: { sent: 0, lastAt: null },
            }),
          ],
    ...over,
  };
}

export function monitoring(over: Partial<CycleMonitoring> = {}): CycleMonitoring {
  return {
    cycleId: 'cy1',
    status: 'SAMPLING_OPEN',
    sampling: { airports: 2, operators: 3, sampleRequired: 150, sampleLocked: 102, lockedOperators: 2 },
    assessment: { invited: 95, started: 55, completed: 40, pending: 55, completionRate: 42.1 },
    byAirport: [
      {
        airportId: 'ap-del',
        iata: 'DEL',
        name: 'Delhi',
        operators: [
          { acoId: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', sampling: { status: 'LOCKED', selectedCount: 52, required: 50 }, invited: 52, started: 30, completed: 20 },
          { acoId: 'org-celebi', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', sampling: { status: 'IN_PROGRESS', selectedCount: 37, required: 50 }, invited: 0, started: 0, completed: 0 },
        ],
      },
      {
        airportId: 'ap-bom',
        iata: 'BOM',
        name: 'Mumbai',
        operators: [{ acoId: 'org-mial', code: 'MCT-BOM', name: 'Mumbai Cargo Terminal', sampling: { status: 'LOCKED', selectedCount: 50, required: 50 }, invited: 43, started: 25, completed: 20 }],
      },
    ],
    ...over,
  };
}

export const SETTINGS: Settings = {
  scoring: { minResponses: 3, weightingMode: 'EQUAL' },
  defaults: { samplingDays: 10, assessmentDays: 30, reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 10, everyDays: 2 } }, tz: 'Asia/Kolkata' },
  branding: { orgName: 'Air Cargo Forum India' },
  rbacVersion: 4,
};

export const AIRPORTS = [
  { id: 'ap-del', iata: 'DEL', icao: 'VIDP', name: 'Delhi', city: 'New Delhi', state: 'Delhi', region: 'North', country: 'IN', lat: 28.5, lng: 77.1, active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'ap-bom', iata: 'BOM', icao: 'VABB', name: 'Mumbai', city: 'Mumbai', state: 'Maharashtra', region: 'West', country: 'IN', lat: 19.1, lng: 72.9, active: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

const OPERATOR_BASE = {
  legalName: null,
  address: null,
  contact: null,
  createdVia: 'ADMIN' as const,
  approvedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const OPERATORS: Operator[] = [
  { ...OPERATOR_BASE, id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 6, customerCount: 212, currentShare: 55 },
  { ...OPERATOR_BASE, id: 'org-celebi', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 4, customerCount: 180, currentShare: 45 },
  { ...OPERATOR_BASE, id: 'org-mial', code: 'MCT-BOM', name: 'Mumbai Cargo Terminal', airport: { id: 'ap-bom', iata: 'BOM', name: 'Mumbai' }, operations: { domestic: true, international: false }, status: 'ACTIVE', memberCount: 3, customerCount: 97, currentShare: 80 },
];

export function notification(over: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    channel: 'EMAIL',
    template: 'cycle-published',
    to: 'priya@csc.example',
    subject: 'Commencement of assessment cycle CSQ 2026 H2',
    body: '…',
    vars: {},
    refs: { cycleId: 'cy1', acoId: 'org-csc', customerId: null, invitationId: null, userId: null },
    status: 'SENT',
    error: null,
    sentAt: '2026-09-25T06:01:00.000Z',
    resendOf: null,
    createdAt: '2026-09-25T06:00:00.000Z',
    ...over,
  };
}

export function auditEntry(over: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: 'a1',
    actorUserId: 'u1',
    actorEmail: 'anita@acfi.example',
    actorOrgId: 'org-acfi',
    orgId: null,
    action: 'cycle.published',
    entity: 'cycle',
    entityId: 'cy1',
    before: { status: 'DRAFT' },
    after: { status: 'PUBLISHED' },
    ip: '127.0.0.1',
    requestId: 'req_42',
    at: '2026-09-25T06:00:00.000Z',
    ...over,
  };
}

export function registration(over: Partial<Registration> = {}): Registration {
  return {
    id: 'r1',
    linkId: 'l1',
    orgType: 'ACO',
    airport: { id: 'ap-blr', iata: 'BLR', name: 'Bengaluru' },
    organisation: { name: 'Menzies Bengaluru', legalName: null, address: { line1: '1', line2: null, city: 'Bengaluru', state: 'Karnataka', pincode: '560300' }, contact: { name: 'R. Shah', email: 'ops@menzies.example', phone: '+91 9000000000' } },
    admin: { name: 'R. Shah', email: 'rshah@menzies.example', phone: '+91 9000000000' },
    operations: { domestic: true, international: true },
    marketSharePct: 30,
    status: 'SUBMITTED',
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    resultOrgId: null,
    createdAt: '2026-10-05T06:00:00.000Z',
    updatedAt: '2026-10-05T06:00:00.000Z',
    ...over,
  };
}

export function currentCycle(over: Partial<CurrentCycle> = {}): CurrentCycle {
  const s = cycleSummary();
  return {
    cycle: { id: s.id, code: s.code, name: s.name, type: s.type, status: s.status, tz: s.tz, sampling: s.sampling, assessment: s.assessment, minSampleSize: s.minSampleSize },
    participant: {
      id: 'cp1',
      cycleId: 'cy1',
      acoId: 'org-csc',
      surveyTypes: ['DOMESTIC', 'INTERNATIONAL'],
      requiredSampleSize: 50,
      sampling: { status: 'IN_PROGRESS', selectedCount: 43, lockedAt: null, lockedBy: null, unlockedAt: null, unlockedBy: null, unlockReason: null },
    },
    nextDeadline: { kind: 'SAMPLING_CLOSES', at: s.sampling.end.utc },
    ...over,
  };
}
