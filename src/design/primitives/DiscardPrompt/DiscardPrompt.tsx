import { Button } from '../Button/Button';
import styles from './DiscardPrompt.module.css';

export type DiscardPromptProps = {
  onKeep: () => void;
  onDiscard: () => void;
  message?: string;
};

/**
 * Drawer footer replacement shown when the user tries to close a dirty form
 * (WAVE1-BRIEF §2 "drawers confirm before discarding dirty state"). Inline
 * rather than a second modal, so focus never has to leave the drawer.
 */
export function DiscardPrompt({ onKeep, onDiscard, message = 'You have unsaved changes.' }: DiscardPromptProps) {
  return (
    <div className={styles.root} role="alertdialog" aria-label="Unsaved changes">
      <span className={styles.message}>{message}</span>
      <span className={styles.actions}>
        <Button variant="ghost" onClick={onKeep} data-autofocus>
          Keep editing
        </Button>
        <Button variant="danger" onClick={onDiscard}>
          Discard
        </Button>
      </span>
    </div>
  );
}
