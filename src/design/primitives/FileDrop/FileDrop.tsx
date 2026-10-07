import { type DragEvent, type ReactNode, useId, useRef, useState } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { Button } from '../Button/Button';
import styles from './FileDrop.module.css';

export type FileDropProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: ReactNode;
  hint?: ReactNode;
  /** Currently chosen files, rendered as a list with a clear action. */
  files?: File[];
  onClear?: () => void;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Drop zone with drag state; the whole area is a keyboard-reachable button. */
export function FileDrop({ onFiles, accept, multiple = false, label = 'Drop a file here, or browse', hint, files, onClear, disabled, error, className }: FileDropProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const choose = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const arr = Array.from(list);
    onFiles(multiple ? arr : arr.slice(0, 1));
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    depth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (disabled) return;
    choose(e.dataTransfer.files);
  };

  return (
    <div className={cn(styles.root, className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(styles.zone, dragging && styles.dragging, disabled && styles.disabled, error && styles.invalid)}
        onClick={() => !disabled && input.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-dragging={dragging || undefined}
      >
        <input
          ref={input}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className={styles.input}
          tabIndex={-1}
          onChange={(e) => {
            choose(e.target.files);
            e.target.value = '';
          }}
        />
        <span className={styles.icon}>
          <Icon name="upload" size={24} />
        </span>
        <span className={styles.label}>{label}</span>
        {accept ? <span className={styles.accept}>{accept.split(',').join(' · ')}</span> : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {files && files.length > 0 ? (
        <ul className={styles.files}>
          {files.map((f) => (
            <li key={`${f.name}-${f.size}`} className={styles.file}>
              <Icon name="file" size={16} />
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>{formatBytes(f.size)}</span>
            </li>
          ))}
          {onClear ? (
            <li className={styles.clear}>
              <Button size="sm" variant="ghost" onClick={onClear}>
                Clear
              </Button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
