import { useMemo } from 'react';

import { type ReminderPlan } from '@/api/types';
import { type WindowInput } from '@/api/cycles.types';
import { Input } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import { useBuilder } from './builderContext';
import styles from './cycles.module.css';
import { reminderSchedule } from './derive';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM-DDTHH:mm' wall-clock → "3 Nov, 09:00" (no zone conversion: it is already local). */
export function formatWall(wall: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(wall);
  if (!m) return wall;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ''}, ${m[4]}:${m[5]}`;
}

function ReminderPreview({ window, plan, label }: { window: WindowInput; plan: ReminderPlan; label: string }) {
  const schedule = useMemo(() => reminderSchedule(window, plan), [window, plan]);
  const valid = Boolean(window.start && window.end);
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{label}</h3>
      {!valid ? (
        <p className={styles.sectionHint}>Set the window first to preview the reminder dates.</p>
      ) : schedule.length === 0 ? (
        <p className={styles.sectionHint}>{plan.count === 0 ? 'No reminders.' : 'No reminder fits inside the window with this cadence.'}</p>
      ) : (
        <>
          <p className={styles.sectionHint}>
            {schedule.length === plan.count ? `${schedule.length} reminders` : `${schedule.length} of ${plan.count} reminders fit the window`} at 09:00 local time:
          </p>
          <ul className={styles.previewList} aria-label={label}>
            {schedule.map((at) => (
              <li key={at} className={styles.previewItem}>
                {formatWall(at)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Step 3 — minimum sample and the two reminder cadences with a live date preview. */
export function SamplingStep() {
  const { form } = useBuilder();
  const { register, watch, formState } = form;
  const e = formState.errors;
  const sampling = watch('sampling');
  const assessment = watch('assessment');
  const reminders = watch('reminders');
  const operators = watch('participatingAcoIds').length;
  const minSampleSize = watch('minSampleSize');

  return (
    <div className={styles.form}>
      <Input
        label="Minimum sample size per operator"
        type="number"
        inputMode="numeric"
        min={0}
        max={100000}
        required
        mono
        hint={
          operators > 0 && Number.isFinite(minSampleSize)
            ? `Operators must lock at least this many customers (fewer only when every eligible customer is selected). ${formatInt(operators)} operators × ${formatInt(minSampleSize)} = ${formatInt(operators * minSampleSize)} invitations expected.`
            : 'Operators must lock at least this many customers; fewer only when every eligible customer is selected.'
        }
        error={e.minSampleSize?.message}
        {...register('minSampleSize', { valueAsNumber: true })}
      />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Sampling reminders</h3>
        <p className={styles.sectionHint}>To operator admins still unlocked, e.g. “Sampling closes in 3 days. Required: 50, selected: 37.” They stop on lock.</p>
        <div className={styles.formRow}>
          <Input label="Number of reminders" type="number" min={0} max={50} mono error={e.reminders?.sampling?.count?.message} {...register('reminders.sampling.count', { valueAsNumber: true })} />
          <Input label="Every (days)" type="number" min={1} max={60} mono error={e.reminders?.sampling?.everyDays?.message} {...register('reminders.sampling.everyDays', { valueAsNumber: true })} />
        </div>
      </div>
      <ReminderPreview window={sampling} plan={reminders.sampling} label="Sampling reminder dates" />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Assessment reminders</h3>
        <p className={styles.sectionHint}>To invited participants who have not submitted. They stop on submit.</p>
        <div className={styles.formRow}>
          <Input label="Number of reminders" type="number" min={0} max={50} mono error={e.reminders?.assessment?.count?.message} {...register('reminders.assessment.count', { valueAsNumber: true })} />
          <Input label="Every (days)" type="number" min={1} max={60} mono error={e.reminders?.assessment?.everyDays?.message} {...register('reminders.assessment.everyDays', { valueAsNumber: true })} />
        </div>
      </div>
      <ReminderPreview window={assessment} plan={reminders.assessment} label="Assessment reminder dates" />
    </div>
  );
}
