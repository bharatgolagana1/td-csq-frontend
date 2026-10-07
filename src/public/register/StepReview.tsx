import { type LinkOrgType, type PublicOnboardingLink } from '@/api/onboarding.types';
import { Button, KeyValue } from '@/design/primitives';

import styles from './register.module.css';
import { type RegisterValues } from './registerSchema';

function Section({ title, step, onEdit, children }: { title: string; step: number; onEdit: (step: number) => void; children: React.ReactNode }) {
  return (
    <section className={styles.reviewSection}>
      <div className={styles.reviewHead}>
        <h3 className={styles.reviewTitle}>{title}</h3>
        <Button size="sm" variant="ghost" onClick={() => onEdit(step)}>
          Edit
        </Button>
      </div>
      {children}
    </section>
  );
}

export type StepReviewProps = { values: RegisterValues; link: PublicOnboardingLink; orgType: LinkOrgType; onEdit: (step: number) => void };

/** Everything entered, grouped by step with an Edit link back to it. */
export function StepReview({ values, link, orgType, onEdit }: StepReviewProps) {
  const a = values.organisation.address;
  const ops = [values.operations.domestic ? 'Domestic' : null, values.operations.international ? 'International' : null].filter((p): p is string => p !== null).join(' · ') || '—';
  return (
    <div className={styles.review}>
      <Section title="Organisation" step={0} onEdit={onEdit}>
        <KeyValue
          columns={2}
          items={[
            { key: 'Name', value: values.organisation.name },
            { key: 'Legal name', value: values.organisation.legalName || '—' },
            { key: 'Airport', value: link.airport ? `${link.airport.iata} · ${link.airport.name}` : '—' },
            { key: 'Operations', value: ops },
            ...(orgType === 'ACO' ? [{ key: 'Market share', value: values.marketSharePct ? `${values.marketSharePct} %` : 'Not given', mono: true }] : []),
          ]}
        />
      </Section>
      <Section title="Address & contact" step={1} onEdit={onEdit}>
        <address className={styles.address}>
          {a.line1}
          <br />
          {a.line2 ? (
            <>
              {a.line2}
              <br />
            </>
          ) : null}
          {a.city}, {a.state} <span className={styles.mono}>{a.pincode}</span>
        </address>
        <KeyValue
          columns={2}
          items={[
            { key: 'Contact', value: values.organisation.contact.name },
            { key: 'Phone', value: values.organisation.contact.phone, mono: true },
            { key: 'E-mail', value: values.organisation.contact.email, mono: true },
          ]}
        />
      </Section>
      <Section title="Administrator" step={2} onEdit={onEdit}>
        <KeyValue
          columns={2}
          items={[
            { key: 'Name', value: values.admin.name },
            { key: 'Mobile', value: values.admin.phone, mono: true },
            { key: 'E-mail', value: values.admin.email, mono: true },
          ]}
        />
      </Section>
    </div>
  );
}
