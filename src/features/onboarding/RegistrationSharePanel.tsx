import { type RegistrationDetail } from '@/api/onboarding.types';
import { Banner, Skeleton } from '@/design/primitives';
import { cn } from '@/lib/cn';
import { formatPct } from '@/lib/format';

import styles from './onboarding.module.css';
import { describeShareFit, projectedTotal, shareFit } from './shareProjection';

export type RegistrationSharePanelProps = {
  registration: RegistrationDetail;
  loading: boolean;
};

/**
 * The airport's current shares, read-only (§7 Onboarding). A SUBMITTED
 * request shows the requested share and the total if approved as asked; the
 * decision form is where that set is rebalanced.
 */
export function RegistrationSharePanel({ registration, loading }: RegistrationSharePanelProps) {
  if (registration.orgType !== 'ACO') return null;
  const share = registration.marketShare;
  const iata = registration.airport?.iata ?? 'the airport';

  if (loading || !share) {
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Market share at {iata}</h3>
        <Skeleton lines={3} />
      </section>
    );
  }

  const reviewing = registration.status === 'SUBMITTED';
  const pct = reviewing ? (registration.marketSharePct ?? 0) : null;
  const after = reviewing ? projectedTotal(share.total, pct) : share.total;
  const fit = shareFit(after);

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Market share at {iata}</h3>
      <ul className={styles.shareList}>
        {share.entries.length === 0 ? <li className={styles.muted}>No shares set yet at {iata}.</li> : null}
        {share.entries.map((e) => (
          <li key={e.acoId} className={styles.shareRow}>
            <span className={styles.shareName}>
              <span className={styles.code}>{e.code}</span>
              <span>{e.name}</span>
            </span>
            <span className={styles.sharePct}>{formatPct(e.sharePct)}</span>
          </li>
        ))}
        {reviewing ? (
          <li className={cn(styles.shareRow, styles.shareRowNew)}>
            <span className={styles.shareName}>
              <span>{registration.organisation.name}</span>
              <span className={styles.muted}>(on approval)</span>
            </span>
            <span className={styles.sharePct}>{formatPct(pct)}</span>
          </li>
        ) : null}
      </ul>
      <div className={styles.shareTotals}>
        <div className={styles.shareTotal}>
          <span className={styles.shareTotalLabel}>Current total</span>
          <span className={styles.shareTotalValue}>{formatPct(share.total)}</span>
        </div>
        <div className={styles.shareTotal}>
          <span className={styles.shareTotalLabel}>{reviewing ? 'After approval' : 'Total'}</span>
          <span className={styles.shareTotalValue}>{formatPct(after)}</span>
        </div>
      </div>
      {reviewing ? (
        <Banner tone={fit.ok ? 'success' : 'warn'} title={describeShareFit(after)}>
          {fit.ok ? `Shares at ${iata} will total 100 %; a cycle there can be published.` : `Shares at ${iata} must total 100 % before a cycle that includes it can be published. Rebalance the set when approving.`}
        </Banner>
      ) : null}
    </section>
  );
}
