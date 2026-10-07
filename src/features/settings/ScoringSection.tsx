import { type Settings } from '@/api/types';
import { Input, Select } from '@/design/primitives';

import { SectionCard } from './SectionCard';
import styles from './settings.module.css';
import { scoringSchema, toScoringForm, toScoringPatch, WEIGHTING_OPTIONS } from './settingsForms';
import { useSectionForm } from './useSectionForm';

export type SectionProps = { settings: Settings; readOnly: boolean };

/** Scoring: minimum responses before a score is shown, and how categories are weighted (§7 Scoring). */
export function ScoringSection({ settings, readOnly }: SectionProps) {
  const { form, ...state } = useSectionForm({ id: 'scoring', label: 'Scoring', schema: scoringSchema, settings, toForm: toScoringForm, toPatch: toScoringPatch, readOnly });
  const { register, formState } = form;
  return (
    <SectionCard id="scoring" title="Scoring" subtitle="How customer ratings become scores and ranks." state={state}>
      <div className={styles.half}>
        <Input
          label="Minimum responses"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          step={1}
          mono
          required
          hint="A question, category or overall score is suppressed when fewer customer assessments than this answered it."
          error={formState.errors.minResponses?.message}
          {...register('minResponses', { valueAsNumber: true })}
        />
      </div>
      <Select label="Weighting" required options={[...WEIGHTING_OPTIONS]} hint="Weighted scoring uses the weight percentages set on each survey's categories and questions." error={formState.errors.weightingMode?.message} {...register('weightingMode')} />
    </SectionCard>
  );
}
