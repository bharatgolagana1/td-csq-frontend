import { Icon } from '@/design/icons';
import { Button, IconButton, Input } from '@/design/primitives';

import { MAX_FOLLOW_UP_OPTIONS } from './nodeForms';
import styles from './surveys.module.css';

export type FollowUpEditorProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
};

/** The follow-up's options (1–10): the choices an assessor can tick after a Fair or Poor rating. */
export function FollowUpEditor({ value, onChange, disabled, error }: FollowUpEditorProps) {
  const update = (index: number, text: string) => onChange(value.map((o, i) => (i === index ? text : o)));
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, '']);

  return (
    <div className={styles.fieldset} role="group" aria-label="Follow-up options">
      <span className={styles.legend}>Options</span>
      {value.length === 0 ? <p className={styles.hintNote}>Add the choices the assessor can tick, e.g. “Delayed acceptance”.</p> : null}
      <ul className={styles.options}>
        {value.map((option, i) => (
          <li key={i} className={styles.optionRow}>
            <Input aria-label={`Option ${i + 1}`} size="sm" value={option} onChange={(e) => update(i, e.target.value)} disabled={disabled} prefix={<span className={styles.optionIndex}>{i + 1}</span>} />
            {!disabled ? <IconButton size="sm" label={`Remove option ${i + 1}`} icon={<Icon name="x" size={16} />} onClick={() => remove(i)} /> : null}
          </li>
        ))}
      </ul>
      {error ? (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
      {!disabled ? (
        <div>
          <Button size="sm" variant="ghost" icon={<Icon name="plus" size={16} />} onClick={add} disabled={value.length >= MAX_FOLLOW_UP_OPTIONS}>
            Add option
          </Button>
        </div>
      ) : null}
    </div>
  );
}
