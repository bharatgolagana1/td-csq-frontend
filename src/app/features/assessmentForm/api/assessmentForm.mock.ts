import type {
  AssessmentSession,
  DraftAnswers,
  Instrument,
  Invite,
  Submission,
} from './assessmentForm.types';
import { coerceDraft } from '../assessmentForm.logic';

/**
 * Sample instrument and invite for the Phase 1 CSQ assessment. Every figure and
 * name here is illustrative and the UI labels it as such: no real operator is
 * being rated.
 *
 * Replace fetchAssessmentSession, saveDraft and submitAssessment with the real
 * calls when the assessment endpoints land. Nothing else in this feature needs
 * to change.
 */

const HEADS: Instrument['heads'] = [
  {
    code: 'INFRASTRUCTURE_FACILITIES',
    label: 'Infrastructure / Facilities',
    shortLabel: 'Infrastructure',
    reasons: [
      'Not enough capacity at peak',
      'Equipment out of service',
      'Congestion and waiting',
      'Condition and upkeep',
      'Cold chain gaps',
      'Not enough information',
    ],
  },
  {
    code: 'SECURITY_SAFETY',
    label: 'Security / Safety',
    shortLabel: 'Security',
    reasons: [
      'Screening delays',
      'Access control lapses',
      'Damage or pilferage',
      'Unsafe practices observed',
      'Slow investigation',
      'Not enough information',
    ],
  },
  {
    code: 'PROCESSES',
    label: 'Processes',
    shortLabel: 'Processes',
    reasons: [
      'Long turnaround',
      'Documentation errors',
      'Status information unreliable',
      'Escalations unanswered',
      'Staffing at peak hours',
      'Not enough information',
    ],
  },
  {
    code: 'TRADE_FACILITATION',
    label: 'Trade Facilitation',
    shortLabel: 'Trade',
    reasons: [
      'Still on manual paperwork',
      'Portal not usable',
      'Charges unclear',
      'Slow coordination with agencies',
      'No priority for urgent cargo',
      'Not enough information',
    ],
  },
];

/** Phase 1: 23 parameters, 8 / 6 / 5 / 4 across the four heads. */
const PARAMETERS: Instrument['parameters'] = [
  {
    id: 'INF-01',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Warehouse space and ULD areas',
    text: 'Adequacy of covered warehouse space at the terminal, including dedicated areas for the build-up and break-down of unit load devices, assessed against the peak tonnage handled during the assessment period rather than the annual average.',
  },
  {
    id: 'INF-02',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Material handling equipment',
    text: 'Availability and serviceability of material handling equipment, including forklifts, elevated transfer vehicles, weighing scales and pallet trucks, together with the time taken by the operator to restore equipment that has been reported out of service.',
  },
  {
    id: 'INF-03',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Temperature controlled facilities',
    text: 'Adequacy of temperature controlled facilities, including cold rooms at differing temperature bands, availability of cool dollies for ramp transfer, and the length of time consignments remain exposed to ambient conditions while moving between storage and aircraft.',
  },
  {
    id: 'INF-04',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Truck docks and landside access',
    text: 'Condition and adequacy of truck docking bays, approach roads and parking within the cargo complex, including the waiting time for a vehicle from arrival at the gate to being allotted a dock for loading or unloading.',
  },
  {
    id: 'INF-05',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Special cargo facilities',
    text: 'Adequacy of dedicated storage and handling facilities for special categories of cargo, including dangerous goods, valuable cargo, human remains and live animals, in line with the regulatory requirements applicable to each category.',
  },
  {
    id: 'INF-06',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Terminal environment and housekeeping',
    text: 'Quality of lighting, ventilation, flooring and drainage inside the cargo terminal, and the general standard of housekeeping maintained across storage, handling and transfer areas throughout the working day.',
  },
  {
    id: 'INF-07',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Customer facing facilities',
    text: 'Adequacy of customer facing facilities provided to representatives of freight forwarders and customs brokers, including documentation counters, seating, drinking water, washrooms and parking, and the hours for which these are kept available.',
  },
  {
    id: 'INF-08',
    head: 'INFRASTRUCTURE_FACILITIES',
    shortLabel: 'Power, fire and building services',
    text: 'Availability and reliability of power backup, fire detection and suppression systems, and other building services essential to uninterrupted cargo operations, including the frequency of unplanned interruptions during the assessment period.',
  },
  {
    id: 'SEC-01',
    head: 'SECURITY_SAFETY',
    shortLabel: 'Access control and passes',
    text: 'Effectiveness of access control at cargo terminal entry points, including the issue and verification of passes for personnel and vehicles, and the control exercised over unauthorised entry into operational and storage areas.',
  },
  {
    id: 'SEC-02',
    head: 'SECURITY_SAFETY',
    shortLabel: 'Screening equipment and throughput',
    text: 'Adequacy and serviceability of screening equipment, including X-ray machines and explosive trace detection, and the throughput achieved during peak periods without any relaxation of the prescribed screening standards.',
  },
  {
    id: 'SEC-03',
    head: 'SECURITY_SAFETY',
    shortLabel: 'CCTV coverage and footage requests',
    text: 'Adequacy of CCTV coverage across storage, handling and transfer areas, the period for which recordings are retained, and the responsiveness of the operator when footage is formally requested for an investigation into loss or damage.',
  },
  {
    id: 'SEC-04',
    head: 'SECURITY_SAFETY',
    shortLabel: 'Pilferage, tampering and damage',
    text: 'Incidence of pilferage, tampering and physical damage to consignments while they are in the custody of the terminal operator, and the effectiveness of the preventive measures taken by the operator to stop recurrence.',
  },
  {
    id: 'SEC-05',
    head: 'SECURITY_SAFETY',
    shortLabel: 'Occupational safety compliance',
    text: 'Compliance with occupational safety requirements inside the terminal, including the use of personal protective equipment, the safe operation of handling equipment, and the reporting and investigation of safety incidents when they occur.',
  },
  {
    id: 'SEC-06',
    head: 'SECURITY_SAFETY',
    shortLabel: 'Dangerous goods handling',
    text: 'Adequacy of procedures for accepting, handling and storing dangerous goods, including segregation by class, verification of declarations and packing, and the competence of the staff deployed on such consignments.',
  },
  {
    id: 'PRO-01',
    head: 'PROCESSES',
    shortLabel: 'Acceptance turnaround',
    text: 'Time taken from the presentation of a consignment at the terminal to the completion of acceptance, covering weighing, screening, documentation checks and the issue of the carting order or receipt, measured during normal working conditions.',
  },
  {
    id: 'PRO-02',
    head: 'PROCESSES',
    shortLabel: 'Documentation accuracy',
    text: 'Accuracy and timeliness of cargo acceptance and delivery documentation issued by the terminal, including the incidence of errors requiring rectification and the time taken to correct them once they have been reported.',
  },
  {
    id: 'PRO-03',
    head: 'PROCESSES',
    shortLabel: 'Breakdown and availability',
    text: 'Time taken from the arrival of an aircraft to consignments being available for delivery, including breakdown of unit load devices, segregation, and placement in the storage location appropriate to the nature of the cargo.',
  },
  {
    id: 'PRO-04',
    head: 'PROCESSES',
    shortLabel: 'Tracking and status information',
    text: 'Effectiveness of the systems used to track consignments within the terminal, and the accuracy and currency of the status information made available to freight forwarders and customs brokers without the need for a physical visit.',
  },
  {
    id: 'PRO-05',
    head: 'PROCESSES',
    shortLabel: 'Query and escalation response',
    text: 'Responsiveness of terminal staff and supervisors to operational queries and escalations, including the time taken to acknowledge a complaint raised in writing and the time taken to close it with a substantive response.',
  },
  {
    id: 'TRD-01',
    head: 'TRADE_FACILITATION',
    shortLabel: 'Digitisation and customer portal',
    text: 'Extent to which terminal processes have been digitised, including electronic submission of documents, online payment of charges, and the availability of a customer portal or mobile application that works reliably in day to day use.',
  },
  {
    id: 'TRD-02',
    head: 'TRADE_FACILITATION',
    shortLabel: 'Coordination with agencies',
    text: 'Support extended by the terminal operator in coordinating with Customs, other regulatory agencies and airline representatives to resolve consignment level issues, without requiring repeated physical follow up by the forwarder or broker.',
  },
  {
    id: 'TRD-03',
    head: 'TRADE_FACILITATION',
    shortLabel: 'Tariff transparency',
    text: 'Transparency and predictability of tariffs levied by the terminal, including advance notice of revisions, clarity of the published charge structure, and the ease of obtaining an itemised explanation of the charges raised on a consignment.',
  },
  {
    id: 'TRD-04',
    head: 'TRADE_FACILITATION',
    shortLabel: 'Perishables and urgent cargo',
    text: 'Facilitation extended to time sensitive and perishable consignments, including priority handling, willingness to extend working hours where operationally required, and support to exporters during seasonal and festival peaks.',
  },
];

const INSTRUMENT: Instrument = {
  version: 'CSQ-P1-v1',
  cycleId: 'FY2025-26',
  cycleLabel: 'FY 2025-26',
  heads: HEADS,
  parameters: PARAMETERS,
};

const INVITE: Invite = {
  token: 'demo',
  assessorName: 'R. Venkatesan',
  organisation: 'Meridian Freight Services Pvt Ltd',
  assessorKind: 'CUSTOMER',
  terminal: {
    acoId: 'aco-bom-1',
    terminalName: 'Cargo Terminal',
    airportIata: 'BOM',
    airportName: 'Mumbai',
    airportFullName: 'Chhatrapati Shivaji Maharaj Intl.',
    scope: 'INTERNATIONAL',
  },
  directions: ['EXPORT', 'IMPORT'],
  assessmentWindow: { opensAt: '2026-09-01T00:00:00+05:30', closesAt: '2026-10-15T23:59:00+05:30' },
  linkExpiresAt: '2026-10-15T23:59:00+05:30',
};

const DOMESTIC_INVITE: Invite = {
  ...INVITE,
  token: 'demo-domestic',
  organisation: 'Sahyadri Cargo Movers',
  terminal: {
    acoId: 'aco-pnq-1',
    terminalName: 'Domestic Cargo Terminal',
    airportIata: 'PNQ',
    airportName: 'Pune',
    airportFullName: 'Pune Intl.',
    scope: 'DOMESTIC',
  },
  directions: ['INBOUND', 'OUTBOUND'],
};

const SUPPORT_EMAIL = 'csq@acfi.org.in';

function contextOf(invite: Invite): { organisation: string; terminalLabel: string; cycleLabel: string } {
  return {
    organisation: invite.organisation,
    terminalLabel: `${invite.terminal.terminalName}, ${invite.terminal.airportName} (${invite.terminal.airportIata})`,
    cycleLabel: INSTRUMENT.cycleLabel,
  };
}

/**
 * Demo state switch. Every gate the assessor can hit is reachable from the URL
 * while the API does not exist, for example /assess?state=expired. This whole
 * mechanism disappears with the mock.
 */
export type DemoState =
  | 'open'
  | 'resume'
  | 'domestic'
  | 'empty'
  | 'error'
  | 'invalid'
  | 'expired'
  | 'not-open'
  | 'closed'
  | 'submitted'
  | 'not-sampled';

const DEMO_STATES: readonly DemoState[] = [
  'open', 'resume', 'domestic', 'empty', 'error', 'invalid',
  'expired', 'not-open', 'closed', 'submitted', 'not-sampled',
];

export function parseDemoState(raw: string | null): DemoState {
  return DEMO_STATES.find((s) => s === raw) ?? 'open';
}

const LATENCY_MS = 420;

/** Survives a submit inside one browser session, so revisiting the link gates correctly. */
let submittedInSession: Submission | null = null;

function storageKey(token: string): string {
  return `csq.assess.draft.${token}`;
}

/**
 * The device copy is the safety net a forwarder on bad mobile data actually
 * depends on: it is written synchronously on every change, before any network
 * call is attempted.
 */
export function readLocalDraft(token: string): DraftAnswers | null {
  try {
    const raw = window.localStorage.getItem(storageKey(token));
    if (!raw) return null;
    return coerceDraft(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeLocalDraft(token: string, draft: DraftAnswers): void {
  try {
    window.localStorage.setItem(storageKey(token), JSON.stringify(draft));
  } catch {
    // private browsing or a full quota: the server copy is still the record
  }
}

export function clearLocalDraft(token: string): void {
  try {
    window.localStorage.removeItem(storageKey(token));
  } catch {
    // nothing recoverable to do
  }
}

const PARTIAL_DRAFT: DraftAnswers = {
  ratings: {
    'INF-01|EXPORT': 4, 'INF-01|IMPORT': 4,
    'INF-02|EXPORT': 3, 'INF-02|IMPORT': 2,
    'INF-03|EXPORT': 5, 'INF-03|IMPORT': 'NA',
    'INF-04|EXPORT': 2,
    'INF-05|EXPORT': 4, 'INF-05|IMPORT': 4,
    'INF-06|EXPORT': 3, 'INF-06|IMPORT': 3,
    'SEC-01|EXPORT': 5, 'SEC-01|IMPORT': 5,
    'SEC-02|EXPORT': 4,
  },
  followUps: {
    'INF-02|IMPORT': {
      reasons: ['Equipment out of service'],
      note: 'Two of the four forklifts on the import side were down through most of August.',
    },
    'INF-04|EXPORT': { reasons: ['Congestion and waiting'], note: '' },
  },
  comments: {
    'INF-03': 'Cold room capacity is good, the gap is the time on the apron before loading.',
  },
  savedAt: '2026-09-19T18:42:00+05:30',
};

export async function fetchAssessmentSession(
  token: string,
  demo: DemoState = 'open',
): Promise<AssessmentSession> {
  await new Promise((r) => setTimeout(r, LATENCY_MS));

  if (demo === 'error') throw new Error('network');

  if (submittedInSession && demo === 'open') {
    return {
      status: 'BLOCKED',
      block: {
        reason: 'ALREADY_SUBMITTED',
        context: contextOf(INVITE),
        submission: submittedInSession,
        effectiveAt: submittedInSession.submittedAt,
        supportEmail: SUPPORT_EMAIL,
      },
    };
  }

  if (demo === 'invalid') {
    return {
      status: 'BLOCKED',
      block: { reason: 'LINK_INVALID', context: null, submission: null, effectiveAt: null, supportEmail: SUPPORT_EMAIL },
    };
  }

  if (demo === 'expired') {
    return {
      status: 'BLOCKED',
      block: {
        reason: 'LINK_EXPIRED',
        context: contextOf(INVITE),
        submission: null,
        effectiveAt: '2026-09-12T23:59:00+05:30',
        supportEmail: SUPPORT_EMAIL,
      },
    };
  }

  if (demo === 'not-open') {
    return {
      status: 'BLOCKED',
      block: {
        reason: 'WINDOW_NOT_OPEN',
        context: contextOf(INVITE),
        submission: null,
        effectiveAt: '2026-11-01T00:00:00+05:30',
        supportEmail: SUPPORT_EMAIL,
      },
    };
  }

  if (demo === 'closed') {
    return {
      status: 'BLOCKED',
      block: {
        reason: 'WINDOW_CLOSED',
        context: contextOf(INVITE),
        submission: null,
        effectiveAt: '2026-08-31T23:59:00+05:30',
        supportEmail: SUPPORT_EMAIL,
      },
    };
  }

  if (demo === 'submitted') {
    return {
      status: 'BLOCKED',
      block: {
        reason: 'ALREADY_SUBMITTED',
        context: contextOf(INVITE),
        submission: { reference: 'CSQ-2526-BOM-0417', submittedAt: '2026-09-14T11:20:00+05:30' },
        effectiveAt: '2026-09-14T11:20:00+05:30',
        supportEmail: SUPPORT_EMAIL,
      },
    };
  }

  // The token authenticates, but this organisation is not in the locked sample
  // for the cycle, or was removed from it. That is a permission refusal, not a
  // broken link, and it has to read as one.
  if (demo === 'not-sampled') {
    return {
      status: 'BLOCKED',
      block: {
        reason: 'NOT_SAMPLED',
        context: contextOf(INVITE),
        submission: null,
        effectiveAt: null,
        supportEmail: SUPPORT_EMAIL,
      },
    };
  }

  const invite = demo === 'domestic' ? DOMESTIC_INVITE : { ...INVITE, token };
  const instrument = demo === 'empty' ? { ...INSTRUMENT, heads: [], parameters: [] } : INSTRUMENT;
  const serverDraft = demo === 'resume' ? PARTIAL_DRAFT : null;

  return { status: 'OPEN', invite, instrument, draft: serverDraft ?? readLocalDraft(token) };
}

export async function saveDraft(token: string, draft: DraftAnswers): Promise<{ savedAt: string }> {
  writeLocalDraft(token, draft);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('offline');
  }
  await new Promise((r) => setTimeout(r, 260));
  return { savedAt: new Date().toISOString() };
}

export async function submitAssessment(token: string, draft: DraftAnswers): Promise<Submission> {
  writeLocalDraft(token, draft);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('offline');
  }
  await new Promise((r) => setTimeout(r, 900));
  const submission: Submission = {
    reference: `CSQ-2526-${INVITE.terminal.airportIata}-0418`,
    submittedAt: new Date().toISOString(),
  };
  submittedInSession = submission;
  clearLocalDraft(token);
  return submission;
}
