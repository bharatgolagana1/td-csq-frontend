import { CYCLE_TYPES } from '@/api/cycles.types';
import { Input, Select } from '@/design/primitives';

import { useBuilder } from './builderContext';
import { CYCLE_TYPE_LABELS } from './cycleLabels';
import styles from './cycles.module.css';

const TYPE_OPTIONS = CYCLE_TYPES.map((t) => ({ value: t, label: CYCLE_TYPE_LABELS[t] }));

/** Step 1 — name, code, survey type, time zone. */
export function BasicsStep() {
  const { form, cycle } = useBuilder();
  const { register, formState } = form;
  const e = formState.errors;
  return (
    <div className={styles.form}>
      <Input label="Cycle name" required placeholder="CSQ 2026 H2" error={e.name?.message} {...register('name')} data-autofocus />
      <div className={styles.formRow}>
        <Input
          label="Code"
          required
          mono
          placeholder="CSQ-26H2"
          hint={cycle ? 'Shown everywhere the cycle is referenced.' : 'Letters, digits, _ or -. Upper case.'}
          error={e.code?.message}
          {...register('code', { setValueAs: (v: string) => v.trim().toUpperCase() })}
        />
        <Select
          label="Survey type"
          required
          options={TYPE_OPTIONS}
          hint="Both runs the domestic and the international survey; operators take the ones they operate."
          error={e.type?.message}
          {...register('type')}
        />
      </div>
      <Input
        label="Time zone"
        required
        placeholder="Asia/Kolkata"
        hint="IANA zone the windows are entered in, e.g. Asia/Kolkata."
        error={e.tz?.message}
        {...register('tz')}
      />
    </div>
  );
}
