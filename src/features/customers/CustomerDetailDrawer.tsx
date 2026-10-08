import { errorMessage, errorRequestId } from '@/api/client';
import { useCustomerParticipation } from '@/api/customers';
import { type Customer } from '@/api/customers.types';
import { Icon } from '@/design/icons';
import { Button, Drawer, EmptyState, KeyValue, Pill, Skeleton, statusVariant, Tag } from '@/design/primitives';
import { formatDateTime, humanise } from '@/lib/format';

import { STATUS_LABELS, SURVEY_LABELS, surveyVariant, TYPE_LABELS, typeVariant } from './customerLabels';
import styles from './customers.module.css';
import { lastSampledLabel } from './CustomersTable';
import { formatPhone } from './phone';

export type CustomerDetailDrawerProps = {
  customer: Customer;
  onClose: () => void;
  canManage: boolean;
  onEdit: (customer: Customer) => void;
};

function submittedPill(submitted: boolean | null) {
  if (submitted === null) return <Pill variant="neutral">Unknown</Pill>;
  return submitted ? <Pill variant="success">Submitted</Pill> : <Pill variant="warn">Not submitted</Pill>;
}

/** Read-only detail with the participation history (§6 GET /customers/:id/participation). */
export function CustomerDetailDrawer({ customer, onClose, canManage, onEdit }: CustomerDetailDrawerProps) {
  const participation = useCustomerParticipation(customer.id, customer.acoId);
  const rows = participation.data?.cycles ?? [];

  return (
    <Drawer
      open
      onClose={onClose}
      title={customer.name}
      description={customer.contactPerson !== customer.name ? customer.contactPerson : undefined}
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {canManage ? (
            <Button variant="primary" icon={<Icon name="edit" size={18} />} onClick={() => onEdit(customer)}>
              Edit
            </Button>
          ) : null}
        </>
      }
    >
      <section className={styles.detailSection} aria-label="Customer">
        <div className={styles.detailHead}>
          <Pill variant={statusVariant(customer.status)}>{STATUS_LABELS[customer.status]}</Pill>
          <Pill variant={typeVariant(customer.type)} dot={false}>
            {customer.type} · {TYPE_LABELS[customer.type]}
          </Pill>
          <Pill variant={surveyVariant(customer.surveyType)} dot={false}>
            {SURVEY_LABELS[customer.surveyType]}
          </Pill>
        </div>
        <KeyValue
          columns={2}
          items={[
            { key: 'E-mail', value: customer.email, mono: true },
            { key: 'Phone', value: formatPhone(customer.phone), mono: true },
            { key: 'Last sampled', value: lastSampledLabel(customer), mono: true },
            { key: 'Added', value: formatDateTime(customer.createdAt) },
            {
              key: 'Tags',
              value:
                customer.tags.length > 0 ? (
                  <span className={styles.tags}>
                    {customer.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </span>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </section>

      <section className={styles.detailSection} aria-label="Participation history">
        <h3 className={styles.detailTitle}>Participation history</h3>
        {participation.isPending ? (
          <Skeleton lines={3} />
        ) : participation.isError ? (
          <EmptyState
            size="sm"
            icon="warning"
            title="Could not load participation"
            description={
              <>
                {errorMessage(participation.error)}
                {errorRequestId(participation.error) ? (
                  <>
                    {' '}
                    · Request <code>{errorRequestId(participation.error)}</code>
                  </>
                ) : null}
              </>
            }
            action={
              <Button variant="secondary" size="sm" onClick={() => void participation.refetch()}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState size="sm" icon="clock" title="Never sampled" description="This customer has not been part of an assessment cycle yet." />
        ) : (
          <ul className={styles.participationList}>
            {rows.map((row) => (
              <li key={`${row.cycleId}-${row.surveyType}`} className={styles.participationItem}>
                <span className={styles.participationCycle}>
                  {row.cycle ? `${row.cycle.name} · ${row.cycle.code}` : 'Cycle no longer visible'}
                  <span className={styles.muted}> · {SURVEY_LABELS[row.surveyType]}</span>
                </span>
                <span className={styles.detailHead}>
                  <Pill variant={statusVariant(row.state)} size="sm">
                    {humanise(row.state)}
                  </Pill>
                  {row.state === 'LOCKED' ? submittedPill(row.submitted) : null}
                </span>
                <span className={styles.participationMeta}>Added {formatDateTime(row.addedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Drawer>
  );
}
