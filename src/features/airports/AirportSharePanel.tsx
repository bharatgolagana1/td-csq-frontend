import { useNavigate } from 'react-router-dom';

import { type MarketShare } from '@/api/marketshare.types';
import { Button, Card, EmptyState, Pill, Progress } from '@/design/primitives';
import { formatPct } from '@/lib/format';

import styles from './airports.module.css';

export type AirportSharePanelProps = {
  airportId: string;
  /** Null when the caller may not see this airport's shares. */
  share: MarketShare | null;
  canEdit: boolean;
};

/** The airport's current (cycle-less) market-share set with the running total; links to the editor. */
export function AirportSharePanel({ airportId, share, canEdit }: AirportSharePanelProps) {
  const navigate = useNavigate();
  const complete = share ? Math.abs(share.total - 100) <= 0.01 : false;
  const edit = canEdit ? (
    <Button size="sm" onClick={() => navigate(`../../market-share?airportId=${airportId}`, { relative: 'path' })}>
      Edit shares
    </Button>
  ) : undefined;

  return (
    <Card title="Current market share" subtitle="The default set, copied into a cycle when it is published." actions={edit}>
      {!share ? (
        <EmptyState icon="lock" size="sm" title="Not visible" description="Market shares are shared with the airport and ACFI only." />
      ) : share.entries.length === 0 ? (
        <EmptyState icon="pie" size="sm" title="No shares set" description="Set each operator's share before publishing a cycle at this airport." action={edit} />
      ) : (
        <>
          <ul className={styles.shareList}>
            {share.entries.map((e) => (
              <li key={e.acoId} className={styles.shareRow}>
                <span className={styles.shareName}>
                  <span className={styles.code}>{e.code}</span>
                  <span>{e.name}</span>
                </span>
                <span className={styles.sharePct}>{formatPct(e.sharePct)}</span>
                <Progress value={e.sharePct} size="sm" className={styles.shareBar} caption="" />
              </li>
            ))}
          </ul>
          <div className={styles.shareTotal}>
            <span>Total</span>
            <span className={styles.shareName}>
              <Pill variant={complete ? 'success' : 'warn'} size="sm">
                {complete ? 'Totals 100 %' : 'Does not total 100 %'}
              </Pill>
              <span className={styles.sharePct}>{formatPct(share.total)}</span>
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
