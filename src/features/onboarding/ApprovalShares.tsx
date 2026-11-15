import { type RegistrationDetail } from '@/api/onboarding.types';
import { Button, Input, Pill, Tag } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './onboarding.module.css';
import { describeShareFit, formatShare } from './shareProjection';
import { type useApprovalShares } from './useApprovalShares';

export type ApprovalSharesProps = {
  registration: RegistrationDetail;
  editor: ReturnType<typeof useApprovalShares>;
};

/**
 * The airport's shares as the approval will save them: every operator active
 * there and the new one, editable, with the live total against 100 % (§7
 * Onboarding: adding an operator never leaves the airport off 100).
 */
export function ApprovalShares({ registration, editor }: ApprovalSharesProps) {
  const iata = registration.airport?.iata ?? 'the airport';
  const current = registration.marketShare?.total ?? 0;
  return (
    <section className={styles.section} aria-label="Market share after approval">
      <h3 className={styles.sectionTitle}>Market share at {iata}</h3>
      <p className={styles.shareHint}>
        {editor.soleOperator
          ? `${registration.organisation.name} will be the only active operator at ${iata}, so it holds 100 %.`
          : `Shares at ${iata} must total exactly 100 % — rebalance the operators already there to make room. The set is saved with the approval.`}
      </p>
      <ul className={styles.shareList}>
        {editor.rows.map((r) => (
          <li key={r.key} className={cn(styles.shareRow, styles.shareEditRow, r.isNew && styles.shareRowNew)}>
            <span className={styles.shareName}>
              {r.isNew ? <Tag tone="accent">New</Tag> : <span className={styles.code}>{r.code}</span>}
              <span>{r.name}</span>
            </span>
            <Input
              aria-label={`Share for ${r.name}`}
              size="sm"
              mono
              inputMode="decimal"
              suffix="%"
              value={r.input}
              placeholder="0"
              error={r.value === null ? 'Enter 0–100' : undefined}
              wrapperClassName={styles.shareInput}
              onChange={(e) => editor.setShare(r.key, e.target.value)}
            />
          </li>
        ))}
      </ul>
      <div className={styles.shareTotals}>
        <div className={styles.shareTotal}>
          <span className={styles.shareTotalLabel}>Current total</span>
          <span className={styles.shareTotalValue}>{formatShare(current)}</span>
        </div>
        <div className={styles.shareTotal}>
          <span className={styles.shareTotalLabel}>After approval</span>
          <span className={styles.shareTotalValue} data-testid="approval-total">
            {formatShare(editor.total)}
          </span>
        </div>
      </div>
      <div className={styles.shareFitRow}>
        <Pill variant={editor.fit.ok ? 'success' : 'warn'}>{describeShareFit(editor.total)}</Pill>
        <Button size="sm" variant="secondary" onClick={editor.fitOthers} disabled={!editor.canFit}>
          {editor.soleOperator ? 'Give it 100 %' : 'Scale the others to fit'}
        </Button>
      </div>
    </section>
  );
}
