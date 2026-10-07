import { type Operator } from '@/api/operators.types';
import { Card, Stat } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import styles from './operators.module.css';

/** Customers tab: the count only — the directory itself is the operator's (Customers area). */
export function OperatorCustomers({ operator }: { operator: Operator }) {
  return (
    <Card title="Customer directory">
      <div className={styles.statRow}>
        <Stat label="Customers on record" value={formatInt(operator.customerCount)} hint="Freight forwarders and customs brokers" size="lg" />
        <Stat label="Members" value={formatInt(operator.memberCount)} hint="People who can manage the directory" />
      </div>
      <p className={styles.hint}>
        The operator maintains its own directory under Customers and samples from it each cycle. Platform users open it from the Customers area with this operator selected.
      </p>
    </Card>
  );
}
