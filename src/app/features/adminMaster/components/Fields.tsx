import { useId, useState, type ChangeEvent, type FC, type ReactNode } from 'react';

interface FieldShellProps {
  id: string;
  label: string;
  hideLabel?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}

const FieldShell: FC<FieldShellProps> = ({ id, label, hideLabel, hint, children }) => (
  <div className="am-field">
    <label htmlFor={id} className={hideLabel ? 'am-sr' : undefined}>
      {label}
    </label>
    {children}
    {hint ? <span className="am-hint">{hint}</span> : null}
  </div>
);

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** how the stored number reads when the field is not being edited */
  format?: (value: number) => string;
  /** how what was typed becomes the stored number */
  parse?: (raw: string) => number;
  step?: number;
  min?: number;
  max?: number;
  hideLabel?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  hint?: ReactNode;
}

/**
 * A number field that keeps what was typed while it has focus. Reformatting on
 * every keystroke eats the decimal point the moment someone types "12." and
 * makes precise entry feel broken.
 */
export const NumberField: FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  format = (v) => String(v),
  parse = Number,
  step = 1,
  min,
  max,
  hideLabel,
  disabled,
  invalid,
  hint,
}) => {
  const id = useId();
  const [raw, setRaw] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setRaw(next);
    if (next.trim() === '') return;
    const parsed = parse(next);
    if (Number.isFinite(parsed)) onChange(parsed);
  };

  return (
    <FieldShell id={id} label={label} hideLabel={hideLabel} hint={hint}>
      <input
        id={id}
        className={invalid ? 'am-input am-num am-num--bad' : 'am-input am-num'}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        value={raw ?? format(value)}
        onChange={handleChange}
        onBlur={() => setRaw(null)}
      />
    </FieldShell>
  );
};

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideLabel?: boolean;
  invalid?: boolean;
  mono?: boolean;
  hint?: ReactNode;
  maxLength?: number;
}

export const TextField: FC<TextFieldProps> = ({
  label, value, onChange, placeholder, hideLabel, invalid, mono, hint, maxLength,
}) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hideLabel={hideLabel} hint={hint}>
      <input
        id={id}
        className="am-input"
        style={mono ? { fontFamily: 'var(--csq-mono)', letterSpacing: '.04em' } : undefined}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
};

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hideLabel?: boolean;
  invalid?: boolean;
  hint?: ReactNode;
  placeholder?: string;
}

export const TextAreaField: FC<TextAreaFieldProps> = ({
  label, value, onChange, rows = 3, hideLabel, invalid, hint, placeholder,
}) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hideLabel={hideLabel} hint={hint}>
      <textarea
        id={id}
        className="am-textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
};

export interface SelectFieldProps<T extends string> {
  label: string;
  value: T | '';
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  placeholder?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  hint?: ReactNode;
}

export function SelectField<T extends string>({
  label, value, options, onChange, placeholder, hideLabel, disabled, hint,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hideLabel={hideLabel} hint={hint}>
      <select
        id={id}
        className="am-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export interface CheckChipProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const CheckChip: FC<CheckChipProps> = ({ label, checked, onChange, disabled }) => (
  <label className={checked ? 'am-check am-check--on' : 'am-check'}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    {label}
  </label>
);
