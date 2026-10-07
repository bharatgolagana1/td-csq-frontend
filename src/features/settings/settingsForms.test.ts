import { describe, expect, it } from 'vitest';

import { type Settings } from '@/api/types';

import { brandingSchema, defaultsSchema, scoringSchema, timeZoneOptions, toBrandingPatch, toDefaultsForm, toDefaultsPatch, toPrivacyForm, toPrivacyPatch, toScoringForm, toScoringPatch } from './settingsForms';

const SETTINGS: Settings = {
  scoring: { minResponses: 3, weightingMode: 'EQUAL' },
  defaults: { samplingDays: 10, assessmentDays: 30, reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 10, everyDays: 2 } }, tz: 'Asia/Kolkata' },
  branding: { orgName: 'Air Cargo Forum India' },
  revealAssessorIdentity: false,
  rbacVersion: 4,
};

describe('settings form mapping', () => {
  it('maps scoring both ways and patches only the scoring section', () => {
    const form = toScoringForm(SETTINGS);
    expect(form).toEqual({ minResponses: 3, weightingMode: 'EQUAL' });
    expect(toScoringPatch({ ...form, minResponses: 5 })).toEqual({ scoring: { minResponses: 5, weightingMode: 'EQUAL' } });
  });

  it('flattens the cycle defaults for the form and nests them back for the PATCH', () => {
    const form = toDefaultsForm(SETTINGS);
    expect(form).toEqual({ samplingDays: 10, assessmentDays: 30, samplingReminderCount: 3, samplingReminderEvery: 3, assessmentReminderCount: 10, assessmentReminderEvery: 2, tz: 'Asia/Kolkata' });
    expect(toDefaultsPatch({ ...form, assessmentReminderEvery: 4, tz: 'Asia/Dubai' })).toEqual({
      defaults: { samplingDays: 10, assessmentDays: 30, reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 10, everyDays: 4 } }, tz: 'Asia/Dubai' },
    });
  });

  it('trims the organisation name and maps the privacy switch', () => {
    expect(toBrandingPatch({ orgName: '  ACFI  ' })).toEqual({ branding: { orgName: 'ACFI' } });
    expect(toPrivacyForm({ ...SETTINGS, revealAssessorIdentity: undefined })).toEqual({ revealAssessorIdentity: false });
    expect(toPrivacyPatch({ revealAssessorIdentity: true })).toEqual({ revealAssessorIdentity: true });
  });

  it('validates the server limits', () => {
    expect(scoringSchema.safeParse({ minResponses: 0, weightingMode: 'EQUAL' }).success).toBe(false);
    expect(scoringSchema.safeParse({ minResponses: 2.5, weightingMode: 'EQUAL' }).error?.issues[0]?.message).toBe('Enter a whole number');
    expect(scoringSchema.safeParse({ minResponses: Number.NaN, weightingMode: 'EQUAL' }).error?.issues[0]?.message).toBe('Enter a whole number');
    expect(defaultsSchema.safeParse({ ...toDefaultsForm(SETTINGS), samplingReminderCount: 0 }).success).toBe(true);
    expect(defaultsSchema.safeParse({ ...toDefaultsForm(SETTINGS), samplingDays: 400 }).error?.issues[0]?.message).toBe('At most 365 days');
    expect(brandingSchema.safeParse({ orgName: '   ' }).error?.issues[0]?.message).toBe('Enter the organisation name');
  });

  it('always offers the current time zone', () => {
    expect(timeZoneOptions('Asia/Kolkata')[0]?.value).toBe('Asia/Kolkata');
    const custom = timeZoneOptions('Pacific/Auckland');
    expect(custom[0]).toEqual({ value: 'Pacific/Auckland', label: 'Pacific/Auckland' });
    expect(custom.some((o) => o.value === 'Asia/Kolkata')).toBe(true);
  });
});
