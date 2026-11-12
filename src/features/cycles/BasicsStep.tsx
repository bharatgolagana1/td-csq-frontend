import { ANSWER_MODES, CYCLE_TYPES } from '@/api/cycles.types';
import { Input, Radio, RadioGroup, Select } from '@/design/primitives';

import { useBuilder } from './builderContext';
import { answerModeLocked } from './builderSchema';
import { ANSWER_MODE_HINTS, ANSWER_MODE_LABELS, CYCLE_TYPE_LABELS } from './cycleLabels';
import styles from './cycles.module.css';

const TYPE_OPTIONS = CYCLE_TYPES.map((t) => ({ value: t, label: CYCLE_TYPE_LABELS[t] }));

/** Step 1 — name, code, survey type, answer mode, time zone. */
export function BasicsStep() {
  const { form, cycle } = useBuilder();
  const { register, formState, watch } = form;
  const e = formState.errors;
  // A published cycle keeps its mode: shown, not registered, so the value stays in the form.
  const locked = answerModeLocked(cycle);
  const answerMode = watch('answerMode');
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
      <div>
        <RadioGroup label="Answer mode">
          {ANSWER_MODES.map((mode) => (
            <Radio key={mode} label={ANSWER_MODE_LABELS[mode]} description={ANSWER_MODE_HINTS[mode]} value={mode} {...(locked ? { checked: answerMode === mode, disabled: true } : register('answerMode'))} />
          ))}
        </RadioGroup>
        {locked ? <p className={styles.sectionHint}>Fixed once the cycle is published.</p> : null}
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
