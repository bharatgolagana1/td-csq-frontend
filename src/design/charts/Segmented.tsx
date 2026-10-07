import { cn } from '@/lib/cn';

import styles from './Segmented.module.css';

export type SegmentedOption<V extends string> = { value: V; label: string; disabled?: boolean };

export type SegmentedProps<V extends string> = {
  options: SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  'aria-label': string;
  size?: 'sm' | 'md';
  /** `inverse`: pills on a dark surface (the dashboard's context strip). */
  tone?: 'default' | 'inverse';
  className?: string;
};

/** Two-to-four way filter toggle for the row above the charts (survey type, level). A radio group, not tabs. */
export function Segmented<V extends string>({ options, value, onChange, 'aria-label': ariaLabel, size = 'sm', tone = 'default', className }: SegmentedProps<V>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn(styles.root, styles[size], tone === 'inverse' && styles.inverse, className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            tabIndex={selected ? 0 : -1}
            className={cn(styles.option, selected && styles.selected)}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const enabled = options.filter((x) => !x.disabled);
              const i = enabled.findIndex((x) => x.value === value);
              const next = enabled[(i + (e.key === 'ArrowRight' ? 1 : enabled.length - 1)) % enabled.length];
              if (next) onChange(next.value);
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
