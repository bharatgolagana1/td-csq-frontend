import { useCallback, useEffect, useState } from 'react';

import { useRegistration } from '@/api/onboarding';
import { type Registration, type RegistrationDetail } from '@/api/onboarding.types';
import { Banner, Button, Drawer, KeyValue, Pill, Skeleton, Tag } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatDateTime, formatPct } from '@/lib/format';

import styles from './onboarding.module.css';
import { ORG_TYPE_LABEL, registrationStatusLabel, registrationStatusVariant } from './onboardingLabels';
import { RegistrationSharePanel } from './RegistrationSharePanel';
import { ReviewForm } from './ReviewForm';

function operationsText(r: Registration): string {
  const parts = [r.operations.domestic ? 'Domestic' : null, r.operations.international ? 'International' : null].filter((p): p is string => p !== null);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function Outcome({ r }: { r: RegistrationDetail }) {
  if (r.status === 'SUBMITTED') return <Banner tone="info" title="Awaiting review">{`Submitted ${formatDateTime(r.createdAt)}. Approval creates the organisation and invites its administrator.`}</Banner>;
  if (r.status === 'APPROVED') {
    return (
      <Banner tone="success" title={`Approved ${formatDateTime(r.reviewedAt)}`}>
        {r.reviewNote ? `Note: ${r.reviewNote}` : 'The administrator has been invited.'}
      </Banner>
    );
  }
  return (
    <Banner tone="danger" title={`Rejected ${formatDateTime(r.reviewedAt)}`}>
      {r.reviewNote ?? '—'}
    </Banner>
  );
}

function Summary({ r }: { r: Registration }) {
  const a = r.organisation.address;
  return (
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Organisation</h3>
        <KeyValue
          columns={2}
          items={[
            { key: 'Name', value: r.organisation.name },
            { key: 'Legal name', value: r.organisation.legalName ?? '—' },
            { key: 'Airport', value: r.airport ? `${r.airport.iata} · ${r.airport.name}` : '—' },
            { key: 'Operations', value: operationsText(r) },
            ...(r.orgType === 'ACO' ? [{ key: 'Requested share', value: formatPct(r.marketSharePct), mono: true }] : []),
          ]}
        />
      </section>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Address &amp; contact</h3>
        <address className={styles.address}>
          {a.line1}
          <br />
          {a.line2 ? (
            <>
              {a.line2}
              <br />
            </>
          ) : null}
          {a.city}, {a.state} <span className={styles.code}>{a.pincode}</span>
        </address>
        <KeyValue
          columns={3}
          items={[
            { key: 'Contact', value: r.organisation.contact.name },
            { key: 'E-mail', value: r.organisation.contact.email, mono: true },
            { key: 'Phone', value: r.organisation.contact.phone, mono: true },
          ]}
        />
      </section>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Administrator</h3>
        <KeyValue
          columns={3}
          items={[
            { key: 'Name', value: r.admin.name },
            { key: 'E-mail', value: r.admin.email, mono: true },
            { key: 'Phone', value: r.admin.phone, mono: true },
          ]}
        />
      </section>
    </>
  );
}

export type RegistrationDrawerProps = {
  id: string | null;
  /** The list row, shown while the detail loads. */
  placeholder?: Registration;
  onClose: () => void;
};

/** The full registration with the airport's share set and, for SUBMITTED requests, the approve / reject form. */
export function RegistrationDrawer({ id, placeholder, onClose }: RegistrationDrawerProps) {
  const query = useRegistration(id ?? undefined, placeholder);
  const r = query.data;
  const [approvingPct, setApprovingPct] = useState<number | undefined>(undefined);
  const onShareChange = useCallback((pct: number | undefined) => setApprovingPct(pct), []);

  useEffect(() => {
    if (!id) setApprovingPct(undefined);
  }, [id]);

  return (
    <Drawer
      open={id !== null}
      onClose={onClose}
      title={r?.organisation.name ?? 'Registration request'}
      description={r ? `${ORG_TYPE_LABEL[r.orgType]}${r.airport ? ` · ${r.airport.iata} ${r.airport.name}` : ''}` : undefined}
      width={640}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {query.isError ? (
        <QueryError error={query.error} title="Could not load this request" onRetry={() => void query.refetch()} />
      ) : !r ? (
        <div className={styles.review} aria-busy="true">
          <Skeleton height={56} />
          <Skeleton lines={4} />
          <Skeleton lines={3} />
        </div>
      ) : (
        <div className={styles.review}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Pill variant={registrationStatusVariant(r.status)}>{registrationStatusLabel(r.status)}</Pill>
            <Tag tone={r.orgType === 'ACO' ? 'accent' : 'neutral'}>{ORG_TYPE_LABEL[r.orgType]}</Tag>
          </div>
          <Outcome r={r} />
          <Summary r={r} />
          <RegistrationSharePanel registration={r} approvingPct={approvingPct} loading={query.isPlaceholderData} />
          {r.status === 'SUBMITTED' && !query.isPlaceholderData ? <ReviewForm key={r.id} registration={r} onShareChange={onShareChange} onDecided={onClose} /> : null}
        </div>
      )}
    </Drawer>
  );
}
