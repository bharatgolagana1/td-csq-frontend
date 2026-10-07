import { type Operations } from '@/api/operators.types';
import { Tag } from '@/design/primitives';

import styles from './operators.module.css';

/** Domestic / International pills; a dash when neither is set. */
export function OperationsTags({ operations }: { operations: Operations }) {
  if (!operations.domestic && !operations.international) return <span className={styles.muted}>—</span>;
  return (
    <span className={styles.tags}>
      {operations.domestic ? <Tag>Domestic</Tag> : null}
      {operations.international ? <Tag>International</Tag> : null}
    </span>
  );
}
