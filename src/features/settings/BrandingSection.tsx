import { Input } from '@/design/primitives';

import { type SectionProps } from './ScoringSection';
import { SectionCard } from './SectionCard';
import { brandingSchema, toBrandingForm, toBrandingPatch } from './settingsForms';
import { useSectionForm } from './useSectionForm';

/** Branding: the organisation name shown in e-mails and on the public assessor pages. */
export function BrandingSection({ settings, readOnly }: SectionProps) {
  const { form, ...state } = useSectionForm({ id: 'branding', label: 'Branding', schema: brandingSchema, settings, toForm: toBrandingForm, toPatch: toBrandingPatch, readOnly });
  const { register, formState } = form;
  return (
    <SectionCard id="branding" title="Branding" subtitle="Shown in every e-mail and on the public assessment pages." state={state}>
      <Input label="Organisation name" required maxLength={200} autoComplete="organization" error={formState.errors.orgName?.message} {...register('orgName')} />
    </SectionCard>
  );
}
