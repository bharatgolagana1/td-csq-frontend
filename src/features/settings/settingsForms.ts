import { z } from 'zod';

import { type Settings, type SettingsPatch } from '@/api/types';

/* Per-section form schemas and the mapping settings → form values → PATCH body.
   Each section saves only its own slice (`PATCH /settings` accepts any subset);
   the limits mirror `settings.schemas.ts` on the server. Pure, so the tests
   cover the mapping without rendering. */

const WHOLE = 'Enter a whole number';
const days = (max = 365) => z.number(WHOLE).int(WHOLE).min(1, 'At least 1 day').max(max, `At most ${max} days`);

export const WEIGHTING_OPTIONS = [
  { value: 'EQUAL', label: 'Equal — every category and question counts the same' },
  { value: 'WEIGHTED', label: 'Weighted — uses the weight percentages set on the survey' },
] as const;

export const scoringSchema = z.object({
  minResponses: z.number(WHOLE).int(WHOLE).min(1, 'At least 1 response').max(1000, 'At most 1,000 responses'),
  weightingMode: z.enum(['EQUAL', 'WEIGHTED']),
});
export type ScoringForm = z.input<typeof scoringSchema>;
export const SCORING_FIELDS = ['minResponses', 'weightingMode'] as const;

export const defaultsSchema = z.object({
  samplingDays: days(),
  assessmentDays: days(),
  samplingReminderCount: z.number(WHOLE).int(WHOLE).min(0, 'Cannot be negative').max(100, 'At most 100 reminders'),
  samplingReminderEvery: days(),
  assessmentReminderCount: z.number(WHOLE).int(WHOLE).min(0, 'Cannot be negative').max(100, 'At most 100 reminders'),
  assessmentReminderEvery: days(),
  tz: z.string().trim().min(1, 'Choose a time zone').max(64),
});
export type DefaultsForm = z.input<typeof defaultsSchema>;
export const DEFAULTS_FIELDS = ['samplingDays', 'assessmentDays', 'samplingReminderCount', 'samplingReminderEvery', 'assessmentReminderCount', 'assessmentReminderEvery', 'tz'] as const;

export const brandingSchema = z.object({
  orgName: z.string().trim().min(1, 'Enter the organisation name').max(200, 'At most 200 characters'),
});
export type BrandingForm = z.input<typeof brandingSchema>;
export const BRANDING_FIELDS = ['orgName'] as const;

export const privacySchema = z.object({ revealAssessorIdentity: z.boolean() });
export type PrivacyForm = z.input<typeof privacySchema>;

/** Time zones offered for cycle defaults; the current value is always added when missing. */
export const TIME_ZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'UTC'] as const;

export function timeZoneOptions(current: string): { value: string; label: string }[] {
  const zones = TIME_ZONES.includes(current as (typeof TIME_ZONES)[number]) ? [...TIME_ZONES] : [current, ...TIME_ZONES];
  return zones.map((z) => ({ value: z, label: z.replace(/_/g, ' ') }));
}

export const toScoringForm = (s: Settings): ScoringForm => ({ minResponses: s.scoring.minResponses, weightingMode: s.scoring.weightingMode });
export const toScoringPatch = (v: ScoringForm): SettingsPatch => ({ scoring: { minResponses: v.minResponses, weightingMode: v.weightingMode } });

export const toDefaultsForm = (s: Settings): DefaultsForm => ({
  samplingDays: s.defaults.samplingDays,
  assessmentDays: s.defaults.assessmentDays,
  samplingReminderCount: s.defaults.reminders.sampling.count,
  samplingReminderEvery: s.defaults.reminders.sampling.everyDays,
  assessmentReminderCount: s.defaults.reminders.assessment.count,
  assessmentReminderEvery: s.defaults.reminders.assessment.everyDays,
  tz: s.defaults.tz,
});
export const toDefaultsPatch = (v: DefaultsForm): SettingsPatch => ({
  defaults: {
    samplingDays: v.samplingDays,
    assessmentDays: v.assessmentDays,
    reminders: {
      sampling: { count: v.samplingReminderCount, everyDays: v.samplingReminderEvery },
      assessment: { count: v.assessmentReminderCount, everyDays: v.assessmentReminderEvery },
    },
    tz: v.tz,
  },
});

export const toBrandingForm = (s: Settings): BrandingForm => ({ orgName: s.branding.orgName });
export const toBrandingPatch = (v: BrandingForm): SettingsPatch => ({ branding: { orgName: v.orgName.trim() } });

export const toPrivacyForm = (s: Settings): PrivacyForm => ({ revealAssessorIdentity: s.revealAssessorIdentity ?? false });
export const toPrivacyPatch = (v: PrivacyForm): SettingsPatch => ({ revealAssessorIdentity: v.revealAssessorIdentity });

/** Server `details` paths arrive as "scoring.minResponses"; map them to the section's field names. */
export const DEFAULTS_PATHS: Record<string, (typeof DEFAULTS_FIELDS)[number]> = {
  'defaults.samplingDays': 'samplingDays',
  'defaults.assessmentDays': 'assessmentDays',
  'defaults.reminders.sampling.count': 'samplingReminderCount',
  'defaults.reminders.sampling.everyDays': 'samplingReminderEvery',
  'defaults.reminders.assessment.count': 'assessmentReminderCount',
  'defaults.reminders.assessment.everyDays': 'assessmentReminderEvery',
  'defaults.tz': 'tz',
};
