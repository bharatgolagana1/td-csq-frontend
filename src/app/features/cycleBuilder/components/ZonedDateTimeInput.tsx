import type { FC } from 'react';
import type { ZonedDateTime } from '../api/cycleBuilder.types';
import type { Issue } from '../lib/cycleRules';
import { formatOffset, formatUtcInstant, toInstant } from '../lib/zonedTime';
import { Field } from './Field';

export interface ZonedDateTimeInputProps {
  id: string;
  label: string;
  help?: string;
  value: ZonedDateTime;
  issues: Issue[];
  disabled?: boolean;
  lockNote?: string;
  /** hides the resolved instant, for rows that already sit under one */
  compact?: boolean;
  onChange: (next: ZonedDateTime) => void;
}

export const ZonedDateTimeInput: FC<ZonedDateTimeInputProps> = ({
  id,
  label,
  help,
  value,
  issues,
  disabled = false,
  lockNote,
  compact = false,
  onChange,
}) => {
  const instant = toInstant(value);

  return (
    <Field id={`${id}-date`} label={label} help={help} issues={issues} lockNote={lockNote}>
      {({ describedBy, invalid }) => (
        <>
          <div className="cb-zoned">
            <input
              type="date"
              id={`${id}-date`}
              className="cb-input cb-input--date"
              value={value.date}
              disabled={disabled}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => onChange({ ...value, date: e.target.value })}
            />
            <input
              type="time"
              id={`${id}-time`}
              className="cb-input cb-input--time"
              value={value.time}
              disabled={disabled}
              aria-label={`${label}, time of day`}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => onChange({ ...value, time: e.target.value })}
            />
          </div>
          {compact ? null : (
            <p className="cb-instant">
              {instant === null ? (
                'Set a date and a time to fix the exact moment this happens.'
              ) : (
                <>
                  <b>{value.timeZone}</b> {formatOffset(instant, value.timeZone)}, which is{' '}
                  {formatUtcInstant(instant)}
                </>
              )}
            </p>
          )}
        </>
      )}
    </Field>
  );
};
