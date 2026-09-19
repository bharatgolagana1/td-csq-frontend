import type {
  Customer,
  CustomerType,
  FormScope,
  ImportField,
  ImportRow,
  ImportRowError,
  ImportValues,
} from './sampling.types';

/* ---- labels ---- */

export const TYPE_LABEL: Record<CustomerType, string> = {
  FREIGHT_FORWARDER: 'Freight forwarder',
  CUSTOMS_BROKER: 'Customs broker',
};

export const SCOPE_LABEL: Record<FormScope, string> = {
  INTERNATIONAL: 'International',
  DOMESTIC: 'Domestic',
  BOTH: 'Both',
};

/** The direction pair a contact will rate. Spelled out because the two ratings
    per question are the part of the instrument people get wrong. */
export const SCOPE_DIRECTIONS: Record<FormScope, string> = {
  INTERNATIONAL: 'Export and Import',
  DOMESTIC: 'Inbound and Outbound',
  BOTH: 'Export, Import, Inbound and Outbound',
};

export const CUSTOMER_TYPES: CustomerType[] = ['FREIGHT_FORWARDER', 'CUSTOMS_BROKER'];
export const FORM_SCOPES: FormScope[] = ['INTERNATIONAL', 'DOMESTIC', 'BOTH'];
export const IMPORT_FIELDS: ImportField[] = ['name', 'company', 'email', 'phone', 'type', 'scope'];

export const FIELD_LABEL: Record<ImportField, string> = {
  name: 'Name',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  type: 'Customer type',
  scope: 'Form scope',
};

/* ---- formatting ---- */

const DATE_FMT = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const DATETIME_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Unknown' : DATE_FMT.format(d);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Unknown' : DATETIME_FMT.format(d);
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/* ---- normalising ---- */

export function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Indian numbers arrive with and without the country code, so comparison uses
    the subscriber number rather than whatever the operator happened to paste. */
export function phoneKey(raw: string): string {
  const digits = normalisePhone(raw);
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).trim().toLowerCase();
}

export function sameDomain(email: string, operatorDomain: string): boolean {
  const domain = emailDomain(email);
  const own = operatorDomain.trim().toLowerCase();
  if (!domain || !own) return false;
  return domain === own || domain.endsWith(`.${own}`);
}

/* ---- the lock gate ---- */

export type LockGate =
  | { kind: 'EMPTY'; canLock: false }
  | { kind: 'SHORT'; canLock: false; needed: number }
  | { kind: 'SELECT_ALL_REQUIRED'; canLock: false; remaining: number; shortfall: number }
  | { kind: 'READY'; canLock: true; shortfall: number }
  | { kind: 'READY_SHORT_DIRECTORY'; canLock: true; shortfall: number };

/**
 * The integrity heart of this screen, kept as a pure function so the rules can
 * be read in one place and tested without a DOM.
 *
 * A directory smaller than the minimum is a real situation at small terminals.
 * It is allowed to lock, but only with every contact in the sample, and the
 * shortfall is recorded on the lock so the score carries its own caveat.
 */
export function evaluateLockGate(directorySize: number, selectedCount: number, minimum: number): LockGate {
  if (directorySize === 0) return { kind: 'EMPTY', canLock: false };

  if (directorySize < minimum) {
    const shortfall = minimum - directorySize;
    if (selectedCount < directorySize) {
      return {
        kind: 'SELECT_ALL_REQUIRED',
        canLock: false,
        remaining: directorySize - selectedCount,
        shortfall,
      };
    }
    return { kind: 'READY_SHORT_DIRECTORY', canLock: true, shortfall };
  }

  if (selectedCount < minimum) return { kind: 'SHORT', canLock: false, needed: minimum - selectedCount };
  return { kind: 'READY', canLock: true, shortfall: 0 };
}

/* ---- integrity signals ---- */

export type IntegrityCode = 'OWN_DOMAIN' | 'DUPLICATE_PHONE' | 'LATE_BURST';

export interface IntegrityFinding {
  code: IntegrityCode;
  headline: string;
  detail: string;
  customerIds: string[];
}

/** A handful of contacts added over a fortnight is housekeeping. A dozen added
    in the last two days is worth a second look before the sample is frozen. */
const BURST_WINDOW_HOURS = 48;
const BURST_MIN_COUNT = 5;

export function findIntegritySignals(
  customers: Customer[],
  operatorDomain: string,
  serverNow: string,
): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];

  const ownDomain = customers.filter((c) => sameDomain(c.email, operatorDomain));
  if (ownDomain.length > 0) {
    findings.push({
      code: 'OWN_DOMAIN',
      headline: `${ownDomain.length} ${plural(ownDomain.length, 'contact uses', 'contacts use')} your own mail domain`,
      detail: `Their email ends in ${operatorDomain}. Colleagues assessing their own terminal belong in the self assessment, which is reported back to you but kept out of the published score.`,
      customerIds: ownDomain.map((c) => c.id),
    });
  }

  const byPhone = new Map<string, string[]>();
  customers.forEach((c) => {
    const key = phoneKey(c.phone);
    if (!key) return;
    const bucket = byPhone.get(key);
    if (bucket) bucket.push(c.id);
    else byPhone.set(key, [c.id]);
  });
  const sharedPhones = [...byPhone.values()].filter((ids) => ids.length > 1);
  if (sharedPhones.length > 0) {
    const ids = sharedPhones.flat();
    findings.push({
      code: 'DUPLICATE_PHONE',
      headline: `${ids.length} contacts share ${sharedPhones.length} phone ${plural(sharedPhones.length, 'number', 'numbers')}`,
      detail: 'A shared desk line is common at a small brokerage. It is also how one person ends up answering twice, so check that each of these reaches a different assessor.',
      customerIds: ids,
    });
  }

  const now = new Date(serverNow).getTime();
  if (!Number.isNaN(now)) {
    const cutoff = now - BURST_WINDOW_HOURS * 3600 * 1000;
    const recent = customers.filter((c) => {
      const added = new Date(c.addedAt).getTime();
      return !Number.isNaN(added) && added >= cutoff;
    });
    if (recent.length >= BURST_MIN_COUNT) {
      findings.push({
        code: 'LATE_BURST',
        headline: `${recent.length} contacts were added in the last ${BURST_WINDOW_HOURS} hours`,
        detail: 'Late additions are expected when a cycle opens and are not a problem in themselves. They are noted on the lock record because a sample assembled at the last minute is read differently from one built over the window.',
        customerIds: recent.map((c) => c.id),
      });
    }
  }

  return findings;
}

/* ---- import: parsing ---- */

export const TEMPLATE_HEADERS = ['Name', 'Company', 'Email', 'Phone', 'Customer type', 'Form scope'];

export const TEMPLATE_CSV = [
  TEMPLATE_HEADERS.join(','),
  'Priya Nair,Meridian Freight Services,priya.nair@meridianfreight.example,+91 98200 11234,Freight forwarder,International',
  'Arun Verma,Sagar Clearing Agents,arun.verma@sagarclearing.example,+91 98450 77812,Customs broker,Both',
].join('\r\n');

/** Deliberately flawed rows, so the validation report can be seen working
    before the real API exists. Every figure here is illustrative. */
export const SAMPLE_IMPORT_CSV = [
  TEMPLATE_HEADERS.join(','),
  'Priya Nair,Meridian Freight Services,priya.nair@meridianfreight.example,+91 98200 11234,Freight forwarder,International',
  'Arun Verma,Sagar Clearing Agents,arun.verma@sagarclearing.example,+91 98450 77812,Customs broker,Both',
  'Nikhil Rao,Trident Cargo Movers,nikhil.rao@tridentcargo.example,+91 99870 24415,Freight forwarder,International',
  'Fatima Sheikh,Konkan Clearing House,fatima.sheikh@konkanclearing.example,+91 98332 66190,CHA,Domestic',
  'Rajesh Menon,Anchor Logistics,rajesh.menon,+91 98111 20034,Freight forwarder,International',
  ',Westline Shipping,contact@westline.example,+91 97020 33481,Freight forwarder,International',
  'Sunita Das,Harbour Gate Brokers,sunita.das@harbourgate.example,9821,Customs broker,Domestic',
  'Imran Qureshi,Silk Route Forwarders,imran.qureshi@silkroute.example,+91 98204 71120,Consultant,International',
  'Kavita Joshi,Deccan Air Cargo,kavita.joshi@deccanaircargo.example,+91 99301 55027,Freight forwarder,Overnight',
  'Priya Nair,Meridian Freight Services,priya.nair@meridianfreight.example,+91 98200 11234,Freight forwarder,International',
].join('\r\n');

/**
 * A comma separated parser that understands quoted fields and doubled quotes.
 * Blank lines are kept so that the reported line number matches the line the
 * operator sees in their own spreadsheet.
 */
export function parseDelimited(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

const HEADER_ALIASES: Record<ImportField, string[]> = {
  name: ['name', 'contact name', 'contact', 'full name', 'person'],
  company: ['company', 'organisation', 'organization', 'firm', 'company name'],
  email: ['email', 'email id', 'e mail', 'email address'],
  phone: ['phone', 'mobile', 'phone number', 'mobile number', 'contact number'],
  type: ['customer type', 'type', 'category'],
  scope: ['form scope', 'scope', 'cargo scope', 'direction'],
};

function headerKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapHeader(cells: string[]): Partial<Record<ImportField, number>> {
  const map: Partial<Record<ImportField, number>> = {};
  cells.forEach((cell, index) => {
    const key = headerKey(cell);
    IMPORT_FIELDS.forEach((field) => {
      if (map[field] === undefined && HEADER_ALIASES[field].includes(key)) map[field] = index;
    });
  });
  return map;
}

const TYPE_ALIASES: Array<[CustomerType, string[]]> = [
  ['FREIGHT_FORWARDER', ['freight forwarder', 'freightforwarder', 'forwarder', 'ff', 'freight']],
  ['CUSTOMS_BROKER', ['customs broker', 'custom broker', 'customsbroker', 'broker', 'cb', 'cha', 'customs house agent']],
];

const SCOPE_ALIASES: Array<[FormScope, string[]]> = [
  ['INTERNATIONAL', ['international', 'intl', 'export import', 'exportimport', 'export', 'import', 'exim']],
  ['DOMESTIC', ['domestic', 'dom', 'inbound outbound', 'inboundoutbound', 'inbound', 'outbound']],
  ['BOTH', ['both', 'all', 'international and domestic', 'domestic and international']],
];

function looseKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function coerceType(raw: string): CustomerType | null {
  const key = looseKey(raw);
  const hit = TYPE_ALIASES.find(([, aliases]) => aliases.includes(key));
  return hit ? hit[0] : null;
}

export function coerceScope(raw: string): FormScope | null {
  const key = looseKey(raw);
  const hit = SCOPE_ALIASES.find(([, aliases]) => aliases.includes(key));
  return hit ? hit[0] : null;
}

export function emptyValues(): ImportValues {
  return { name: '', company: '', email: '', phone: '', type: '', scope: '' };
}

export const MAX_IMPORT_ROWS = 1000;

/** Rows straight off the file, before validation. */
export function readRows(text: string): { rows: Array<{ lineNumber: number; values: ImportValues }>; fileError: string | null } {
  const grid = parseDelimited(text);
  const firstFilled = grid.findIndex((cells) => cells.some((c) => c.trim() !== ''));

  if (firstFilled === -1) return { rows: [], fileError: 'That file is empty.' };

  const header = mapHeader(grid[firstFilled]);
  const missing = IMPORT_FIELDS.filter((f) => header[f] === undefined);
  if (missing.length > 0) {
    return {
      rows: [],
      fileError: `The first row of the file has to name the columns. Missing: ${missing
        .map((f) => FIELD_LABEL[f])
        .join(', ')}. Download the template to get the exact headings.`,
    };
  }

  const rows: Array<{ lineNumber: number; values: ImportValues }> = [];
  for (let i = firstFilled + 1; i < grid.length; i += 1) {
    const cells = grid[i];
    if (!cells.some((c) => c.trim() !== '')) continue;
    const values = emptyValues();
    IMPORT_FIELDS.forEach((field) => {
      const index = header[field];
      values[field] = index !== undefined ? (cells[index] ?? '').trim() : '';
    });
    rows.push({ lineNumber: i + 1, values });
    if (rows.length > MAX_IMPORT_ROWS) {
      return { rows: [], fileError: `That file has more than ${MAX_IMPORT_ROWS} rows. Split it and import in parts.` };
    }
  }

  if (rows.length === 0) return { rows: [], fileError: 'That file has column headings but no contacts under them.' };
  return { rows, fileError: null };
}

/* ---- import: validation ---- */

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 13;

/**
 * Validates every row against the directory and against the rest of the file.
 * Re-run after each in place correction, so an edit that fixes a duplicate
 * clears the error on the other row too.
 */
export function validateImportRows(
  rows: Array<{ lineNumber: number; values: ImportValues }>,
  existing: Customer[],
): ImportRow[] {
  const existingEmails = new Set(existing.map((c) => c.email.trim().toLowerCase()));
  const emailCounts = new Map<string, number>();
  rows.forEach(({ values }) => {
    const key = values.email.trim().toLowerCase();
    if (key) emailCounts.set(key, (emailCounts.get(key) ?? 0) + 1);
  });

  return rows.map(({ lineNumber, values }) => {
    const errors: ImportRowError[] = [];
    const push = (field: ImportField, message: string) => errors.push({ field, message });

    if (!values.name.trim()) push('name', 'A contact name is required.');
    else if (values.name.trim().length > 80) push('name', 'Keep the name under 80 characters.');

    if (!values.company.trim()) push('company', 'A company is required.');

    const email = values.email.trim().toLowerCase();
    if (!email) push('email', 'An email is required. The assessment link is sent to it.');
    else if (!EMAIL_RE.test(email)) push('email', 'That does not look like an email address.');
    else if (existingEmails.has(email)) push('email', 'This email is already in your directory.');
    else if ((emailCounts.get(email) ?? 0) > 1) push('email', 'This email appears more than once in this file.');

    const digits = normalisePhone(values.phone);
    if (!digits) push('phone', 'A phone number is required. Assessors arrive from a WhatsApp link.');
    else if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) {
      push('phone', `That is ${digits.length} ${plural(digits.length, 'digit', 'digits')}. Expected ${MIN_PHONE_DIGITS} to ${MAX_PHONE_DIGITS}.`);
    }

    if (!values.type.trim()) push('type', 'Freight forwarder or Customs broker.');
    else if (!coerceType(values.type)) push('type', `"${values.type}" is not a customer type. Use Freight forwarder or Customs broker.`);

    if (!values.scope.trim()) push('scope', 'International, Domestic or Both.');
    else if (!coerceScope(values.scope)) push('scope', `"${values.scope}" is not a form scope. Use International, Domestic or Both.`);

    return { lineNumber, values, errors };
  });
}

export function rowToDraft(values: ImportValues): {
  name: string;
  company: string;
  email: string;
  phone: string;
  type: CustomerType;
  scope: FormScope;
} | null {
  const type = coerceType(values.type);
  const scope = coerceScope(values.scope);
  if (!type || !scope) return null;
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    type,
    scope,
  };
}

/* ---- template download ---- */

export function downloadCsv(fileName: string, csv: string): void {
  // The byte order mark keeps Excel from mangling the headings on open.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
