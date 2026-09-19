import type { AssessorType, CategoryCode } from './history.types';

/** The Phase 1 instrument: 23 parameters across four heads. */
export interface ParameterDef {
  no: number;
  category: CategoryCode;
  question: string;
  /** parameters a respondent plausibly cannot rate, so NA turns up where it should */
  naProne?: boolean;
}

export const PARAMETERS: ParameterDef[] = [
  { no: 1, category: 'INFRASTRUCTURE_FACILITIES', question: 'Cargo acceptance and delivery counters: number, condition and working hours' },
  { no: 2, category: 'INFRASTRUCTURE_FACILITIES', question: 'Covered storage and warehouse space against the volume handled' },
  { no: 3, category: 'INFRASTRUCTURE_FACILITIES', question: 'Cold chain and temperature controlled storage', naProne: true },
  { no: 4, category: 'INFRASTRUCTURE_FACILITIES', question: 'Material handling equipment: availability, condition and uptime' },
  { no: 5, category: 'INFRASTRUCTURE_FACILITIES', question: 'Truck docking bays, parking and vehicle movement inside the terminal' },
  { no: 6, category: 'INFRASTRUCTURE_FACILITIES', question: 'ULD storage and build up or break down areas' },
  { no: 7, category: 'INFRASTRUCTURE_FACILITIES', question: 'Amenities for trade staff and drivers: waiting area, washrooms, canteen' },
  { no: 8, category: 'INFRASTRUCTURE_FACILITIES', question: 'Signage, lighting and housekeeping across the terminal' },
  { no: 9, category: 'SECURITY_SAFETY', question: 'Screening equipment availability and throughput' },
  { no: 10, category: 'SECURITY_SAFETY', question: 'Access control and issue of passes for staff and vehicles' },
  { no: 11, category: 'SECURITY_SAFETY', question: 'Handling of dangerous goods in line with DGR', naProne: true },
  { no: 12, category: 'SECURITY_SAFETY', question: 'Protection of cargo against pilferage, damage and exposure' },
  { no: 13, category: 'SECURITY_SAFETY', question: 'CCTV coverage and response to reported incidents' },
  { no: 14, category: 'SECURITY_SAFETY', question: 'Fire safety readiness and emergency preparedness' },
  { no: 15, category: 'PROCESSES', question: 'Cargo acceptance and documentation checks at the counter' },
  { no: 16, category: 'PROCESSES', question: 'Time taken from gate in to acceptance, including truck turnaround' },
  { no: 17, category: 'PROCESSES', question: 'Accuracy and timeliness of cargo information in the system' },
  { no: 18, category: 'PROCESSES', question: 'Handling of irregularities, shortages and damage reports' },
  { no: 19, category: 'PROCESSES', question: 'Delivery process and time taken from request to handover' },
  { no: 20, category: 'TRADE_FACILITATION', question: 'Coordination with customs and regulatory agencies on site' },
  { no: 21, category: 'TRADE_FACILITATION', question: 'Helpdesk responsiveness and escalation handling' },
  { no: 22, category: 'TRADE_FACILITATION', question: 'Transparency of tariffs, billing and dispute resolution' },
  { no: 23, category: 'TRADE_FACILITATION', question: 'Digital services: booking, e-payment and shipment status visibility' },
];

/**
 * [assessor type, reference number, rating centre, days into the assessment
 * window when it was submitted]. A null offset means the response is still
 * open. The rating centre is what makes one forwarder read as consistently
 * harsher than another rather than as noise.
 */
export type SeedTuple = [AssessorType, number, number, number | null];

export const SEEDS: Record<string, SeedTuple[]> = {
  'CY-2026-H2': [],
  'CY-2026-H1': [
    ['CTO', 1, 5, 9],
    ['INDEPENDENT_AUDITOR', 1, 4, 52],
    ['INDEPENDENT_AUDITOR', 2, 3, 66],
    ['FREIGHT_FORWARDER', 1, 4, 4],
    ['FREIGHT_FORWARDER', 2, 3, 6],
    ['FREIGHT_FORWARDER', 3, 5, 11],
    ['FREIGHT_FORWARDER', 4, 2, 13],
    ['FREIGHT_FORWARDER', 5, 4, 18],
    ['FREIGHT_FORWARDER', 6, 3, 21],
    ['FREIGHT_FORWARDER', 7, 4, 27],
    ['FREIGHT_FORWARDER', 8, 3, 34],
    ['FREIGHT_FORWARDER', 9, 5, 39],
    ['FREIGHT_FORWARDER', 10, 2, 44],
    ['CUSTOMS_BROKER', 1, 4, 8],
    ['CUSTOMS_BROKER', 2, 3, 16],
    ['CUSTOMS_BROKER', 3, 4, 24],
    ['CUSTOMS_BROKER', 4, 3, 31],
    ['CUSTOMS_BROKER', 5, 5, 58],
    ['FREIGHT_FORWARDER', 11, 3, null],
    ['FREIGHT_FORWARDER', 12, 4, null],
    ['CUSTOMS_BROKER', 6, 3, null],
    ['CUSTOMS_BROKER', 7, 4, null],
    ['CUSTOMS_BROKER', 8, 2, null],
  ],
  'CY-2025-H2': [
    ['CTO', 1, 5, 12],
    ['INDEPENDENT_AUDITOR', 1, 3, 48],
    ['INDEPENDENT_AUDITOR', 2, 4, 55],
    ['FREIGHT_FORWARDER', 1, 3, 3],
    ['FREIGHT_FORWARDER', 2, 3, 5],
    ['FREIGHT_FORWARDER', 3, 4, 9],
    ['FREIGHT_FORWARDER', 4, 2, 14],
    ['FREIGHT_FORWARDER', 5, 4, 17],
    ['FREIGHT_FORWARDER', 6, 2, 19],
    ['FREIGHT_FORWARDER', 7, 3, 22],
    ['FREIGHT_FORWARDER', 8, 4, 26],
    ['FREIGHT_FORWARDER', 9, 3, 29],
    ['FREIGHT_FORWARDER', 10, 5, 33],
    ['FREIGHT_FORWARDER', 11, 2, 37],
    ['CUSTOMS_BROKER', 1, 3, 7],
    ['CUSTOMS_BROKER', 2, 4, 15],
    ['CUSTOMS_BROKER', 3, 3, 20],
    ['CUSTOMS_BROKER', 4, 2, 25],
    ['CUSTOMS_BROKER', 5, 4, 30],
    ['CUSTOMS_BROKER', 6, 3, 41],
    ['CUSTOMS_BROKER', 7, 3, 61],
  ],
};

/**
 * Comment pools. Real free text is the point of the comments surface, so these
 * read like the trade rather than like filler.
 *
 * Each entry names the parameters it actually speaks to, so a remark about
 * driver washrooms never turns up under the question about screening machines,
 * and the tone it sits in has to match the rating it is attached to.
 */
export interface PooledComment {
  params: number[];
  text: string;
}

export type Tone = 'critical' | 'neutral' | 'positive';

export const COMMENT_POOL: Record<CategoryCode, Record<Tone, PooledComment[]>> = {
  INFRASTRUCTURE_FACILITIES: {
    positive: [
      { params: [1], text: 'The new acceptance hall has made a visible difference. Trolleys are available and the queue clears fast even on a Monday morning.' },
      { params: [2, 6], text: 'There is enough covered space to stage a full build up without cargo standing outside in the sun.' },
      { params: [3], text: 'Cold room capacity was expanded last year and our pharma shipments now hold temperature end to end.' },
      { params: [4], text: 'Equipment uptime has improved since the new fleet came in. We rarely wait for a forklift now.' },
      { params: [5], text: 'Dock allocation is orderly now that the bays are numbered and the marshals actually direct vehicles.' },
      { params: [7], text: 'The driver rest area with drinking water and a working washroom is a genuine improvement on last year.' },
      { params: [8], text: 'Lighting and housekeeping in the export shed are among the best we deal with anywhere in the country.' },
    ],
    neutral: [
      { params: [1, 8], text: 'Facilities are about what we expect at a metro terminal. Nothing exceptional in either direction.' },
      { params: [2, 6], text: 'Space is adequate on a normal day. Peak season is a different picture and we plan around it.' },
      { params: [3], text: 'The cold room works. Whether a shipment is moved into it quickly depends on which shift is on.' },
      { params: [4], text: 'Equipment is serviceable. Two of the four forklifts on the import side are old but they do the work.' },
      { params: [5], text: 'Parking is manageable off peak and close to impossible between four and eight in the evening.' },
      { params: [7], text: 'Basic amenities exist. They are not maintained through the night shift.' },
    ],
    critical: [
      { params: [1], text: 'Counters shut for an hour at shift change with no notice and the queue simply builds behind it.' },
      { params: [2], text: 'Covered space runs out in peak and cargo waits on the apron until something moves.' },
      { params: [3], text: 'The cold room is full more often than not, so temperature sensitive cargo sits outside it.' },
      { params: [4], text: 'Half the forklifts are down on any given day and we wait for one to come free.' },
      { params: [5], text: 'Truck parking outside the gate is the single biggest problem. We lose an hour before we reach the dock on most days.' },
      { params: [6], text: 'The break down area floods in the monsoon and cargo sits on wet floors until someone finds pallets.' },
      { params: [7], text: 'There is no usable waiting area or washroom for drivers. They wait six hours with nowhere to sit.' },
      { params: [8], text: 'Signage has not been updated since the layout changed. New drivers end up at the wrong shed.' },
    ],
  },
  SECURITY_SAFETY: {
    positive: [
      { params: [9], text: 'Screening throughput improved a lot after the second machine was commissioned. X-ray turnaround is predictable now.' },
      { params: [10], text: 'Passes are issued the same day and the guard post genuinely checks them instead of waving people through.' },
      { params: [11], text: 'Dangerous goods are handled by the book here. The staff know the documentation and they do not cut corners.' },
      { params: [12], text: 'Loose cargo is wrapped and stored properly. We have not had a shortage claim against this terminal this year.' },
      { params: [13], text: 'The control room pulled footage for us within the hour when we asked for it.' },
      { params: [14], text: 'Fire drills actually happen and the assembly points are marked and kept clear.' },
    ],
    neutral: [
      { params: [9], text: 'Screening keeps up on a normal day. One wide body build up backs it up immediately.' },
      { params: [10], text: 'Pass issue is straightforward when the paperwork is perfect. It rarely is.' },
      { params: [11], text: 'Dangerous goods acceptance follows the checklist. It takes time, which is the point of it.' },
      { params: [12], text: 'No incidents to report this cycle, and nothing exceptional either way.' },
      { params: [13], text: 'CCTV coverage exists. We have never had to test whether footage can actually be retrieved quickly.' },
      { params: [14], text: 'Safety briefings happen. Whether they reach the contract labour is another question.' },
    ],
    critical: [
      { params: [9], text: 'One screening machine for the whole export side. When it goes down, everything behind it stops.' },
      { params: [10], text: 'Pass renewal takes a week with no interim arrangement, so trained staff sit idle while the paperwork moves.' },
      { params: [11], text: 'Dangerous goods documentation is checked by staff who change every month and read the rules differently.' },
      { params: [12], text: 'Pilferage on loose cargo is still not addressed. We raised two shortage cases this quarter and neither was closed.' },
      { params: [13], text: 'We reported a damaged shipment with a camera reference and never received a reply.' },
      { params: [14], text: 'Fire exits in the import shed were blocked with empty ULDs when we were last there. We pointed it out and nothing changed.' },
    ],
  },
  PROCESSES: {
    positive: [
      { params: [15], text: 'Acceptance staff check documents once and check them correctly. Rework has come down noticeably.' },
      { params: [16], text: 'Gate to acceptance is quick outside peak. Thirty to forty minutes is normal for us now.' },
      { params: [17], text: 'System updates are prompt. What we see online matches what is on the floor.' },
      { params: [18], text: 'The shift supervisor on the export side takes ownership when something is stuck. That is what makes the difference.' },
      { params: [19], text: 'Delivery against a clean set of documents takes under thirty minutes most days, which is better than it used to be.' },
    ],
    neutral: [
      { params: [15], text: 'Documentation checks are thorough, which is good, but the same document is checked at three separate points.' },
      { params: [16], text: 'Turnaround is average for a metro terminal. We build the delay into what we promise shippers.' },
      { params: [17], text: 'The process is fine when the system is up. When it is not, everything moves to paper and slows right down.' },
      { params: [18], text: 'Claims get acknowledged. Closing one takes as long as it takes.' },
      { params: [19], text: 'Delivery is predictable on a weekday and unpredictable on a weekend.' },
    ],
    critical: [
      { params: [15], text: 'The same set of documents is rejected by one counter and accepted by the next.' },
      { params: [16], text: 'Gate in to acceptance takes over two hours in the evening peak, and the counter closes for shift change without notice.' },
      { params: [17], text: 'System status does not match physical status. Cargo shows as received while it is still sitting on the truck.' },
      { params: [18], text: 'Shortage and damage reports go in and we hear nothing for weeks. There is no reference number for a complaint.' },
      { params: [19], text: 'Delivery orders raised after four in the afternoon effectively become the next day. Nobody says so in advance.' },
    ],
  },
  TRADE_FACILITATION: {
    positive: [
      { params: [20], text: 'Customs coordination on site is genuinely good. Queries get resolved within the same shift.' },
      { params: [21], text: 'The helpdesk closes our queries without us having to escalate, and the escalation list is current.' },
      { params: [22], text: 'Billing disputes are rare and when one comes up the charge is explained against the published tariff.' },
      { params: [23], text: 'The online status page is accurate enough that we have stopped sending a person to check.' },
    ],
    neutral: [
      { params: [20], text: 'Customs coordination is fine for routine consignments and slow for anything unusual.' },
      { params: [21], text: 'The helpdesk responds. Whether the answer helps depends on who picks up the phone.' },
      { params: [22], text: 'A tariff sheet is published. Mapping a line on the invoice back to it is not always straightforward.' },
      { params: [23], text: 'Digital services work for booking. Everything after booking is still a phone call.' },
    ],
    critical: [
      { params: [20], text: 'When customs raises a query nobody at the terminal takes ownership of moving it along.' },
      { params: [21], text: 'The escalation matrix on the notice board is three years old. Half the numbers on it do not work.' },
      { params: [22], text: 'Demurrage keeps running while the terminal is the reason for the delay, and there is no mechanism to contest it.' },
      { params: [23], text: 'Online status is not reliable so we still send a person to verify. That defeats the purpose of the portal.' },
    ],
  },
};

export const NOT_APPLICABLE_COMMENTS: string[] = [
  'We do not move this commodity through this terminal, so I am not able to rate it.',
  'Not applicable to our operation on this side.',
  'No experience of this in the current cycle, so I have left it unrated.',
];
