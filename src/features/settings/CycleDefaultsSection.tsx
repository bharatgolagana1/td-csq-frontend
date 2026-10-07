import { Input, Select } from '@/design/primitives';
import { describeTimeZone } from '@/lib/format';

import { type SectionProps } from './ScoringSection';
import { SectionCard } from './SectionCard';
import styles from './settings.module.css';
import { DEFAULTS_PATHS, defaultsSchema, timeZoneOptions, toDefaultsForm, toDefaultsPatch } from './settingsForms';
import { useSectionForm } from './useSectionForm';

const whole = { type: 'number', inputMode: 'numeric', step: 1, mono: true } as const;

/** Cycle defaults: window lengths, reminder cadence and time zone pre-filled into every new cycle (§5 settings.defaults). */
export function CycleDefaultsSection({ settings, readOnly }: SectionProps) {
  const { form, ...state } = useSectionForm({
    id: 'defaults',
    label: 'Cycle defaults',
    schema: defaultsSchema,
    settings,
    toForm: toDefaultsForm,
    toPatch: toDefaultsPatch,
    pathToField: DEFAULTS_PATHS,
    readOnly,
  });
  const { register, formState, watch } = form;
  const errors = formState.errors;
  const tz = watch('tz');

  return (
    <SectionCard id="defaults" title="Cycle defaults" subtitle="Pre-filled when a new cycle is created; each cycle can override them." state={state} className={styles.span2}>
      <div className={styles.row}>
        <Input label="Sampling window" suffix="days" min={1} max={365} required hint="How long operators have to select and lock their sample." error={errors.samplingDays?.message} {...whole} {...register('samplingDays', { valueAsNumber: true })} />
        <Input label="Assessment window" suffix="days" min={1} max={365} required hint="How long customers have to complete their assessment." error={errors.assessmentDays?.message} {...whole} {...register('assessmentDays', { valueAsNumber: true })} />
      </div>

      <div className={styles.row}>
        <div className={styles.group} role="group" aria-labelledby="settings-defaults-sampling-reminders">
          <span id="settings-defaults-sampling-reminders" className={styles.groupTitle}>
            Sampling reminders
          </span>
          <p className={styles.groupHint}>To operator admins who have not locked their sample; they stop on lock.</p>
          <div className={styles.row}>
            <Input label="Count" min={0} max={100} required error={errors.samplingReminderCount?.message} {...whole} {...register('samplingReminderCount', { valueAsNumber: true })} />
            <Input label="Every" suffix="days" min={1} max={365} required error={errors.samplingReminderEvery?.message} {...whole} {...register('samplingReminderEvery', { valueAsNumber: true })} />
          </div>
        </div>
        <div className={styles.group} role="group" aria-labelledby="settings-defaults-assessment-reminders">
          <span id="settings-defaults-assessment-reminders" className={styles.groupTitle}>
            Assessment reminders
          </span>
          <p className={styles.groupHint}>To invited customers who have not submitted; they stop on submission.</p>
          <div className={styles.row}>
            <Input label="Count" min={0} max={100} required error={errors.assessmentReminderCount?.message} {...whole} {...register('assessmentReminderCount', { valueAsNumber: true })} />
            <Input label="Every" suffix="days" min={1} max={365} required error={errors.assessmentReminderEvery?.message} {...whole} {...register('assessmentReminderEvery', { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <Select label="Time zone" required options={timeZoneOptions(settings.defaults.tz)} hint={tz ? `Cycle windows are entered as wall-clock times in this zone · ${describeTimeZone(tz)}` : undefined} error={errors.tz?.message} {...register('tz')} />
      </div>
    </SectionCard>
  );
}
