import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type PublicInvitation } from '@/api/publicAssess.types';

import { closesOn, cycleTz, formatZoned, stakeholderLabel, surveyTypeLabel, zoneAbbr } from './format';

const invitation: PublicInvitation = {
  state: 'SENT',
  cycle: { id: 'c1', name: 'CSQ 2026 · Q4', assessmentEnd: '2026-10-31T18:29:59.000Z' },
  operator: { name: 'Delhi Cargo Services', airport: { iata: 'DEL', name: 'Indira Gandhi International' } },
  surveyType: 'DOMESTIC',
  customer: { nameMasked: 'A*** R***', emailMasked: 'a***@delcargo.test' },
  submittedAt: null,
};

describe('public assess formatters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('falls back to Asia/Kolkata when the cycle carries no zone', () => {
    expect(cycleTz(invitation)).toBe('Asia/Kolkata');
    expect(cycleTz({ cycle: { ...invitation.cycle, tz: 'Asia/Dubai' } })).toBe('Asia/Dubai');
    expect(cycleTz(null)).toBe('Asia/Kolkata');
  });

  it('formats instants in the cycle zone with its abbreviation', () => {
    const text = formatZoned('2026-10-31T18:29:59.000Z', 'Asia/Kolkata');
    expect(text.startsWith('31 Oct 2026, 23:59')).toBe(true);
    expect(text).toContain(zoneAbbr('Asia/Kolkata'));
    expect(formatZoned(null, 'Asia/Kolkata')).toBe('—');
    expect(formatZoned('garbage', 'Asia/Kolkata')).toBe('—');
  });

  it('closesOn gives the absolute wall time and a relative countdown', () => {
    const closes = closesOn(invitation);
    expect(closes.past).toBe(false);
    expect(closes.absolute.startsWith('31 Oct 2026, 23:59')).toBe(true);
    expect(closes.relative).toBe('closes in 24 days');
    const past = closesOn({ ...invitation, cycle: { ...invitation.cycle, assessmentEnd: '2026-10-01T00:00:00Z' } });
    expect(past.past).toBe(true);
    expect(past.relative).toBe('closed');
  });

  it('labels survey and stakeholder types', () => {
    expect(surveyTypeLabel('DOMESTIC')).toBe('Domestic');
    expect(surveyTypeLabel('INTERNATIONAL')).toBe('International');
    expect(stakeholderLabel('FF')).toBe('Freight forwarder');
    expect(stakeholderLabel('CB')).toBe('Customs broker');
    expect(stakeholderLabel(undefined)).toBeNull();
  });
});
