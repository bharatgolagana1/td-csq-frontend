import { Controller } from 'react-hook-form';

import { Icon } from '@/design/icons';
import { Button, DateTimeInput, Input } from '@/design/primitives';

import { useBuilder } from './builderContext';
import styles from './cycles.module.css';
import { deriveWindows, isCalendarDate } from './derive';
import { WindowTimeline } from './WindowTimeline';

/**
 * Step 2 — one initiation date derives both windows from Settings → defaults
 * (sampling N days, then assessment M days, midnight activation); the four
 * DateTimeInputs stay editable. The timeline follows every change.
 */
export function WindowsStep() {
  const { form, settings } = useBuilder();
  const { register, control, watch, setValue, formState, trigger } = form;
  const e = formState.errors;
  const tz = watch('tz');
  const initiationDate = watch('initiationDate');
  const sampling = watch('sampling');
  const assessment = watch('assessment');
  const defaults = settings?.defaults;
  const canDerive = Boolean(defaults) && isCalendarDate(initiationDate);

  const derive = () => {
    if (!defaults || !isCalendarDate(initiationDate)) return;
    const w = deriveWindows(initiationDate, defaults);
    setValue('sampling.start', w.sampling.start, { shouldDirty: true });
    setValue('sampling.end', w.sampling.end, { shouldDirty: true });
    setValue('assessment.start', w.assessment.start, { shouldDirty: true });
    setValue('assessment.end', w.assessment.end, { shouldDirty: true });
    void trigger(['sampling.start', 'sampling.end', 'assessment.start', 'assessment.end']);
  };

  return (
    <div className={styles.form}>
      <div className={styles.deriveRow}>
        <Input
          label="Initiation date"
          type="date"
          hint={
            defaults
              ? `Sampling opens at 00:00 on this day and runs ${defaults.samplingDays} days; the assessment follows for ${defaults.assessmentDays} days (Settings → defaults).`
              : 'Loading the platform defaults…'
          }
          error={e.initiationDate?.message}
          {...register('initiationDate')}
        />
        <Button variant="secondary" icon={<Icon name="calendar" size={18} />} disabled={!canDerive} onClick={derive}>
          Derive windows
        </Button>
      </div>

      <WindowTimeline windows={{ sampling, assessment }} tz={tz} />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Sampling window</h3>
        <p className={styles.sectionHint}>Operators select and lock their customer samples. Reminders go to operators still unlocked.</p>
        <div className={styles.formRow}>
          <Controller
            control={control}
            name="sampling.start"
            render={({ field }) => <DateTimeInput label="Sampling opens" required tz={tz} value={field.value || null} onChange={(v) => field.onChange(v ?? '')} error={e.sampling?.start?.message} />}
          />
          <Controller
            control={control}
            name="sampling.end"
            render={({ field }) => <DateTimeInput label="Sampling closes" required tz={tz} value={field.value || null} onChange={(v) => field.onChange(v ?? '')} error={e.sampling?.end?.message} />}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Assessment window</h3>
        <p className={styles.sectionHint}>Invitations go out when the assessment opens; links stop working when it closes.</p>
        <div className={styles.formRow}>
          <Controller
            control={control}
            name="assessment.start"
            render={({ field }) => <DateTimeInput label="Assessment opens" required tz={tz} value={field.value || null} onChange={(v) => field.onChange(v ?? '')} error={e.assessment?.start?.message} />}
          />
          <Controller
            control={control}
            name="assessment.end"
            render={({ field }) => <DateTimeInput label="Assessment closes" required tz={tz} value={field.value || null} onChange={(v) => field.onChange(v ?? '')} error={e.assessment?.end?.message} />}
          />
        </div>
      </div>
    </div>
  );
}
