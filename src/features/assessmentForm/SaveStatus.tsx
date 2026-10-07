import { formatInTimeZone } from 'date-fns-tz';
import { type ReactNode } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';
import { DEFAULT_TZ } from '@/lib/format';

import styles from './parts.module.css';
import { type SaveStatus as SaveStatusValue } from './types';

export type SaveStatusProps = {
  status: SaveStatusValue;
  onRetry?: () => void;
  /** Time zone for "Saved · 12:04" (the cycle's). */
  tz?: string;
  className?: string;
};

function timeOf(iso: string, tz: string): string {
  try {
    return formatInTimeZone(new Date(iso), tz, 'HH:mm');
  } catch {
    return '';
  }
}

/** "Saved · 12:04" / "Saving…" / "Offline — kept on this device" / "Could not save · Retry". */
export function SaveStatus({ status, onRetry, tz = DEFAULT_TZ, className }: SaveStatusProps) {
  let body: ReactNode = null;
  let tone: string | undefined;
  switch (status.kind) {
    case 'idle':
      body = null;
      break;
    case 'saving':
      tone = styles.saveSaving;
      body = (
        <>
          <Icon name="spinner" size={16} className={styles.saveIcon} />
          <span>Saving…</span>
        </>
      );
      break;
    case 'saved':
      tone = styles.saveSaved;
      body = (
        <>
          <Icon name="check" size={16} className={styles.saveIcon} />
          <span>
            Saved · <span className={styles.saveTime}>{timeOf(status.at, tz)}</span>
          </span>
        </>
      );
      break;
    case 'offline':
      tone = styles.saveOffline;
      body = (
        <>
          <Icon name="warning" size={16} className={styles.saveIcon} />
          <span>Offline — kept on this device</span>
        </>
      );
      break;
    case 'error':
      tone = styles.saveError;
      body = (
        <>
          <Icon name="warning" size={16} className={styles.saveIcon} />
          <span>Could not save</span>
          {onRetry ? (
            <button type="button" className={styles.saveRetry} onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </>
      );
      break;
  }
  return (
    <span className={cn(styles.save, tone, className)} role="status" aria-live="polite" title={status.kind === 'error' ? `${status.message}${status.requestId ? ` · Request ${status.requestId}` : ''}` : undefined}>
      {body}
    </span>
  );
}
