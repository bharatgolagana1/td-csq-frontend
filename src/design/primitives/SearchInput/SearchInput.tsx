import { type InputHTMLAttributes, useEffect, useRef, useState } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './SearchInput.module.css';

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'size'> & {
  value: string;
  onChange: (value: string) => void;
  /** Debounce `onChange` by N ms (the field itself stays responsive). */
  debounce?: number;
  size?: 'sm' | 'md';
  label?: string;
};

export function SearchInput({ value, onChange, debounce = 0, size = 'md', label = 'Search', placeholder = 'Search', className, ...rest }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the local copy in sync when the parent resets the value.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const emit = (next: string) => {
    setLocal(next);
    window.clearTimeout(timer.current);
    if (debounce > 0) timer.current = window.setTimeout(() => onChange(next), debounce);
    else onChange(next);
  };

  return (
    <div className={cn(styles.root, styles[size], className)}>
      <Icon name="search" size={16} className={styles.icon} />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={label}
        className={styles.input}
        placeholder={placeholder}
        value={local}
        onChange={(e) => emit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && local) {
            e.preventDefault();
            emit('');
          }
        }}
        {...rest}
      />
      {local ? (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={() => {
            emit('');
            inputRef.current?.focus();
          }}
        >
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}
