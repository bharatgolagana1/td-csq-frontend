import { Button } from '@/design/primitives';

import styles from './surveys.module.css';

export type OrderSaveBarProps = {
  /** Sibling groups whose order differs from the server. */
  groups: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

/** Sticky bar under the tree while a reorder is pending: one PUT /order saves every moved group at once. */
export function OrderSaveBar({ groups, saving, onSave, onDiscard }: OrderSaveBarProps) {
  return (
    <div className={styles.saveBar} role="region" aria-label="Unsaved order">
      <span className={styles.saveCount} aria-live="polite">
        Order changed in {groups} {groups === 1 ? 'group' : 'groups'} · not saved
      </span>
      <div className={styles.saveActions}>
        <Button variant="ghost" onClick={onDiscard} disabled={saving}>
          Discard
        </Button>
        <Button variant="primary" onClick={onSave} loading={saving}>
          Save order
        </Button>
      </div>
    </div>
  );
}
