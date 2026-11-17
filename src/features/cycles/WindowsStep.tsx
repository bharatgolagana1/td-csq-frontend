import { useQuery } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';

import { Icon } from '@/design/icons';
import { Button, DatePicker, DateTimeInput } from '@/design/primitives';

import { useBuilder } from './builderContext';
import styles from './cycles.module.css';
import { deriveWindows, isCalendarDate } from './derive';
import { fetchCycleSchedule, isCycleDateReserved } from './scheduleConflict';
import { WindowTimeline } from './WindowTimeline';

/**
 * Step 2 — one initiation date derives both windows from Settings → defaults
 * (sampling N days, then assessment M days, midnight activation); the four
 * DateTimeInputs stay editable. The timeline follows every change.
 */
export function WindowsStep() {
  const { form, settings, cycle } = useBuilder();
  const schedule = useQuery({ queryKey: ['cycles', 'schedule'], queryFn: ({ signal }) => fetchCycleSchedule(signal) });
  const { control, watch, setValue, formState, trigger } = form;
  const e = formState.errors;
  const tz = watch('tz');
  const initiationDate = watch('initiationDate');
  const sampling = watch('sampling');
  const assessment = watch('assessment');
  const defaults = settings?.defaults;
  const canDerive = Boolean(defaults) && isCalendarDate(initiationDate);
  const disabledDates = (date: string) => isCycleDateReserved(date, tz, schedule.data ?? [], cycle?.id);
  const scheduleUnavailable = schedule.isPending || schedule.isError;

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
        <Controller
          control={control}
          name="initiationDate"
          render={({ field }) => (
            <DatePicker
              label="Initiation date"
              value={field.value || null}
              onChange={(date) => field.onChange(date ?? '')}
              disabledDates={disabledDates}
              disabled={scheduleUnavailable}
              tz={tz}
              hint={
                defaults
                  ? `Sampling opens at 00:00 on this day and runs ${defaults.samplingDays} days; the assessment follows for ${defaults.assessmentDays} days (Settings → defaults).`
                  : 'Loading the platform defaults…'
              }
              error={e.initiationDate?.message}
            />
          )}
        />
        <Button variant="secondary" icon={<Icon name="calendar" size={18} />} disabled={!canDerive || scheduleUnavailable || disabledDates(initiationDate)} onClick={derive}>
          Derive windows
        </Button>
      </div>

      <WindowTimeline windows={{ sampling, assessment }} tz={tz} />

      <section className={styles.section} aria-label="Sampling window">
        <h3 className={styles.sectionTitle}>Sampling window</h3>
        <p className={styles.sectionHint}>Operators select and lock their customer samples. Reminders go to operators still unlocked.</p>
        <div className={styles.formRow}>
          <Controller
            control={control}
            name="sampling.start"
            render={({ field }) => <DateTimeInput label="Sampling opens" required tz={tz} value={field.value || null} disabledDates={disabledDates} disabled={scheduleUnavailable} onChange={(v) => field.onChange(v ?? '')} error={e.sampling?.start?.message} />}
          />
          <Controller
            control={control}
            name="sampling.end"
            render={({ field }) => <DateTimeInput label="Sampling closes" required tz={tz} value={field.value || null} disabledDates={disabledDates} disabled={scheduleUnavailable} onChange={(v) => field.onChange(v ?? '')} error={e.sampling?.end?.message} />}
          />
        </div>
      </section>

      <section className={styles.section} aria-label="Assessment window">
        <h3 className={styles.sectionTitle}>Assessment window</h3>
        <p className={styles.sectionHint}>Invitations go out when the assessment opens; links stop working when it closes.</p>
        <div className={styles.formRow}>
          <Controller
            control={control}
            name="assessment.start"
            render={({ field }) => <DateTimeInput label="Assessment opens" required tz={tz} value={field.value || null} disabledDates={disabledDates} disabled={scheduleUnavailable} onChange={(v) => field.onChange(v ?? '')} error={e.assessment?.start?.message} />}
          />
          <Controller
            control={control}
            name="assessment.end"
            render={({ field }) => <DateTimeInput label="Assessment closes" required tz={tz} value={field.value || null} disabledDates={disabledDates} disabled={scheduleUnavailable} onChange={(v) => field.onChange(v ?? '')} error={e.assessment?.end?.message} />}
          />
        </div>
      </section>
    </div>
  );
}
