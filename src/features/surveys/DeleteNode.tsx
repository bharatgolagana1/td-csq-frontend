import { useState } from 'react';

import { Icon } from '@/design/icons';
import { Button } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';

import styles from './surveys.module.css';

export type DeleteNodeProps = {
  /** "category INFRA" — used in the button label and the dialog title. */
  what: string;
  /** What goes with it (subcategories, questions). */
  consequence: string;
  pending: boolean;
  onDelete: () => void;
};

/** The delete action of a node form: a ghost button and its confirmation. */
export function DeleteNode({ what, consequence, pending, onDelete }: DeleteNodeProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" className={styles.deleteBtn} icon={<Icon name="trash" size={16} />} onClick={() => setOpen(true)} disabled={pending}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        title={`Delete ${what}?`}
        description={consequence}
        confirmLabel="Delete"
        danger
        loading={pending}
      />
    </>
  );
}
