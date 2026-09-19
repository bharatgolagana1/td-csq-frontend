import type { FlagTally, IntegrityCode, SampledContact } from '../api/approvals.types';

export type FlagSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FlagMeta {
  label: string;
  severity: FlagSeverity;
  /** shown wherever the chip alone is not enough, which is most places */
  explain: string;
  colour: string;
}

export const FLAG_META: Record<IntegrityCode, FlagMeta> = {
  OWN_DOMAIN_EMAIL: {
    label: 'Own domain',
    severity: 'HIGH',
    explain:
      'The address is on the operator’s own mail domain, so this may be the operator’s own staff rating the operator rather than a customer.',
    colour: 'var(--csq-r1)',
  },
  DUPLICATE_EMAIL: {
    label: 'Duplicate email',
    severity: 'HIGH',
    explain:
      'Another contact in this batch uses the same address, so two seats in the sample reach one inbox.',
    colour: 'var(--csq-r1)',
  },
  DUPLICATE_PHONE: {
    label: 'Duplicate phone',
    severity: 'HIGH',
    explain:
      'Another contact in this batch uses the same number, so one person may be holding two seats in the sample.',
    colour: 'var(--csq-r1)',
  },
  FREE_MAIL: {
    label: 'Free mail',
    severity: 'MEDIUM',
    explain:
      'A personal mail domain rather than a company one. The stated employer cannot be verified from the address alone.',
    colour: 'var(--csq-r2)',
  },
  ADDED_LATE: {
    label: 'Added late',
    severity: 'LOW',
    explain:
      'Added after assessment had already opened. The windows are allowed to overlap, so this is permitted, and it is still worth a look.',
    colour: 'var(--csq-r3)',
  },
};

export const FLAG_ORDER: IntegrityCode[] = [
  'OWN_DOMAIN_EMAIL',
  'DUPLICATE_EMAIL',
  'DUPLICATE_PHONE',
  'FREE_MAIL',
  'ADDED_LATE',
];

export const SEVERITY_WEIGHT: Record<FlagSeverity, number> = { HIGH: 12, MEDIUM: 5, LOW: 2 };

/** Consumer mail providers common in Indian trade correspondence. */
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'rediffmail.com',
  'icloud.com',
  'protonmail.com',
]);

export function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).trim().toLowerCase();
}

/** Digits only, so +91 98xxx and 098xxx are recognised as one number. */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export interface IntegrityContext {
  operatorDomains: string[];
  /** a contact added after this instant is a late addition */
  assessmentOpensAt: string;
}

/**
 * Recomputed over the whole working set rather than per row, because the
 * duplicate signals are relationships: removing one half of a pair has to
 * clear the flag on the other half.
 */
export function recomputeFlags(
  contacts: SampledContact[],
  ctx: IntegrityContext,
): SampledContact[] {
  const ownDomains = new Set(ctx.operatorDomains.map((d) => d.toLowerCase()));
  const lateAfter = new Date(ctx.assessmentOpensAt).getTime();

  const byEmail = new Map<string, string[]>();
  const byPhone = new Map<string, string[]>();
  for (const c of contacts) {
    const email = c.email.trim().toLowerCase();
    const phone = normalisePhone(c.phone);
    if (email) byEmail.set(email, [...(byEmail.get(email) ?? []), c.id]);
    if (phone) byPhone.set(phone, [...(byPhone.get(phone) ?? []), c.id]);
  }

  return contacts.map((c) => {
    const flags: IntegrityCode[] = [];
    const domain = domainOf(c.email);
    const email = c.email.trim().toLowerCase();
    const phone = normalisePhone(c.phone);
    let duplicateOf: string | undefined;

    if (domain && ownDomains.has(domain)) flags.push('OWN_DOMAIN_EMAIL');

    const emailPeers = (byEmail.get(email) ?? []).filter((id) => id !== c.id);
    if (emailPeers.length > 0) {
      flags.push('DUPLICATE_EMAIL');
      duplicateOf = emailPeers[0];
    }

    const phonePeers = (byPhone.get(phone) ?? []).filter((id) => id !== c.id);
    if (phonePeers.length > 0) {
      flags.push('DUPLICATE_PHONE');
      duplicateOf = duplicateOf ?? phonePeers[0];
    }

    if (domain && FREE_MAIL_DOMAINS.has(domain)) flags.push('FREE_MAIL');

    // a contact the reviewer added is not the operator adding late
    if (c.origin === 'OPERATOR' && new Date(c.addedAt).getTime() > lateAfter) {
      flags.push('ADDED_LATE');
    }

    return { ...c, flags, duplicateOf };
  });
}

export function tallyFlags(contacts: SampledContact[]): FlagTally {
  const tally: FlagTally = {};
  for (const c of contacts) {
    for (const f of c.flags) tally[f] = (tally[f] ?? 0) + 1;
  }
  return tally;
}

export function severityOf(code: IntegrityCode): FlagSeverity {
  return FLAG_META[code].severity;
}

export function highestSeverity(flags: IntegrityCode[]): FlagSeverity | null {
  if (flags.some((f) => severityOf(f) === 'HIGH')) return 'HIGH';
  if (flags.some((f) => severityOf(f) === 'MEDIUM')) return 'MEDIUM';
  if (flags.length > 0) return 'LOW';
  return null;
}

export function sortFlags(flags: IntegrityCode[]): IntegrityCode[] {
  return [...flags].sort((a, b) => FLAG_ORDER.indexOf(a) - FLAG_ORDER.indexOf(b));
}

/**
 * The row level sentence. Duplicate signals name the other contact, because
 * "duplicate phone" without the pair is a colour, not an explanation.
 */
export function explainFlag(
  code: IntegrityCode,
  contact: SampledContact,
  byId: Map<string, SampledContact>,
): string {
  const base = FLAG_META[code].explain;
  if (code !== 'DUPLICATE_EMAIL' && code !== 'DUPLICATE_PHONE') return base;
  const peer = contact.duplicateOf ? byId.get(contact.duplicateOf) : undefined;
  if (!peer) return base;
  const who = `${peer.name} at ${peer.company}`;
  return code === 'DUPLICATE_EMAIL'
    ? `Shares an address with ${who}, so two seats in the sample reach one inbox.`
    : `Shares a number with ${who}, so one person may be holding two seats in the sample.`;
}

export function countFlagged(contacts: SampledContact[]): number {
  return contacts.filter((c) => c.flags.length > 0).length;
}
