import { Controller } from 'react-hook-form';

import { Switch } from '@/design/primitives';

import { type SectionProps } from './ScoringSection';
import { SectionCard } from './SectionCard';
import styles from './settings.module.css';
import { privacySchema, toPrivacyForm, toPrivacyPatch } from './settingsForms';
import { useSectionForm } from './useSectionForm';

/** Privacy: whether operators see who assessed them (§5 settings.revealAssessorIdentity). */
export function PrivacySection({ settings, readOnly }: SectionProps) {
  const { form, ...state } = useSectionForm({ id: 'privacy', label: 'Privacy', schema: privacySchema, settings, toForm: toPrivacyForm, toPatch: toPrivacyPatch, readOnly });
  return (
    <SectionCard id="privacy" title="Privacy" subtitle="What operators can see about the people who assessed them." state={state}>
      <Controller
        control={form.control}
        name="revealAssessorIdentity"
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={field.onChange}
            disabled={field.disabled}
            label="Reveal assessor identity to operators"
            description={field.value ? 'On: operator users see the customer name and e-mail behind each returned assessment.' : 'Off (default): returned assessments are shown to operators without the assessor’s identity.'}
          />
        )}
      />
      <p className={styles.explain}>
        Customers rate more candidly when their answers cannot be traced back to them, which is why this is off by default. ACFI roles always see every assessment with its assessor, and the setting applies platform-wide to every cycle.
      </p>
    </SectionCard>
  );
}
