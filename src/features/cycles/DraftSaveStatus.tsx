import { formatInTimeZone } from 'date-fns-tz';
import { type ReactNode } from 'react';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';
import { DEFAULT_TZ } from '@/lib/format';

import styles from './cycles.module.css';
import { type SaveState, type Unsaved } from './useDraftAutosave';

export type DraftSaveStatusProps = {
  state: SaveState;
  unsaved: Unsaved;
  hasDraft: boolean;
  onRetry: () => void;
  /** Zone for "Draft saved · 14:02" (the cycle's when valid). */
  tz?: string;
};

function timeOf(iso: string, tz: string): string {
  try {
    return formatInTimeZone(new Date(iso), tz, 'HH:mm');
  } catch {
    return formatInTimeZone(new Date(iso), DEFAULT_TZ, 'HH:mm');
  }
}

/** "Saving…" / "Draft saved · 14:02" / "Couldn't save — Retry", and why something is not saved yet. */
export function DraftSaveStatus({ state, unsaved, hasDraft, onRetry, tz = DEFAULT_TZ }: DraftSaveStatusProps) {
  let tone: string | undefined;
  let body: ReactNode = null;
  if (state.kind === 'saving') {
    tone = styles.saveSaving;
    body = (
      <>
        <Icon name="spinner" size={16} className={styles.saveIcon} />
        <span>Saving…</span>
      </>
    );
  } else if (state.kind === 'error') {
    tone = styles.saveError;
    body = (
      <>
        <Icon name="warning" size={16} className={styles.saveIcon} />
        <span>Couldn’t save —</span>
        <button type="button" className={styles.saveRetry} onClick={onRetry}>
          Retry
        </button>
      </>
    );
  } else if (!hasDraft && unsaved.any) {
    tone = styles.saveWarn;
    body = <span>Not saved yet — a draft is created once Basics is complete</span>;
  } else if (unsaved.blocked) {
    tone = styles.saveWarn;
    body = (
      <>
        <Icon name="warning" size={16} className={styles.saveIcon} />
        <span>Some changes are not saved — fix the highlighted fields</span>
      </>
    );
  } else if (state.kind === 'saved') {
    tone = styles.saveSaved;
    body = (
      <>
        <Icon name="check" size={16} className={styles.saveIcon} />
        <span>
          Draft saved · <span className={styles.saveTime}>{timeOf(state.at, tz)}</span>
        </span>
      </>
    );
  }
  return (
    <span
      className={cn(styles.save, tone)}
      role="status"
      aria-live="polite"
      title={state.kind === 'error' ? `${state.message}${state.requestId ? ` · Request ${state.requestId}` : ''}` : undefined}
    >
      {body}
    </span>
  );
}
