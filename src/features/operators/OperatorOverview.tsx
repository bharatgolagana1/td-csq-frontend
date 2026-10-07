import { Link } from 'react-router-dom';

import { type Operator } from '@/api/operators.types';
import { Card, KeyValue, Pill, statusVariant } from '@/design/primitives';
import { formatDateTime, formatPct, humanise } from '@/lib/format';

import { OperationsTags } from './OperationsTags';
import { createdViaLabel } from './operatorLabels';
import styles from './operators.module.css';

/** Overview tab: the organisation record, its contact and registered address. */
export function OperatorOverview({ operator, canSeeAirport }: { operator: Operator; canSeeAirport: boolean }) {
  const airport = canSeeAirport ? (
    <Link to={`../../airports/${operator.airport.id}`} relative="path" className={styles.nameLink}>
      {operator.airport.iata} · {operator.airport.name}
    </Link>
  ) : (
    `${operator.airport.iata} · ${operator.airport.name}`
  );
  return (
    <div className={styles.detailGrid}>
      <Card title="Details">
        <KeyValue
          columns={2}
          items={[
            { key: 'Code', value: operator.code, mono: true },
            { key: 'Status', value: <Pill variant={statusVariant(operator.status)}>{humanise(operator.status)}</Pill> },
            { key: 'Legal name', value: operator.legalName ?? '—' },
            { key: 'Airport', value: airport },
            { key: 'Operations', value: <OperationsTags operations={operator.operations} /> },
            { key: 'Current market share', value: formatPct(operator.currentShare), mono: true },
            { key: 'Onboarded via', value: createdViaLabel(operator.createdVia) },
            { key: 'Approved', value: formatDateTime(operator.approvedAt), mono: true },
            { key: 'Created', value: formatDateTime(operator.createdAt), mono: true },
            { key: 'Updated', value: formatDateTime(operator.updatedAt), mono: true },
          ]}
        />
      </Card>
      <div className={styles.stack}>
        <Card title="Organisation contact">
          {operator.contact ? (
            <KeyValue
              columns={1}
              layout="rows"
              items={[
                { key: 'Name', value: operator.contact.name },
                { key: 'E-mail', value: operator.contact.email, mono: true },
                { key: 'Phone', value: operator.contact.phone, mono: true },
              ]}
            />
          ) : (
            <p className={styles.muted}>No contact on record.</p>
          )}
        </Card>
        <Card title="Registered address">
          {operator.address ? (
            <address className={styles.address}>
              {operator.address.line1}
              <br />
              {operator.address.line2 ? (
                <>
                  {operator.address.line2}
                  <br />
                </>
              ) : null}
              {operator.address.city}, {operator.address.state} <span className={styles.code}>{operator.address.pincode}</span>
            </address>
          ) : (
            <p className={styles.muted}>No address on record.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
