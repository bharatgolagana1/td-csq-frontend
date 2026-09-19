import type { FC } from 'react';
import type { CycleRatings, DashboardData } from '../api/dashboard.types';

const Row: FC<{ name: string; r: CycleRatings }> = ({ name, r }) => {
  const gap = r.self !== null && r.customer !== null ? r.self - r.customer : null;
  return (
    <div className="csq-cmp-row">
      <span className="name">{name}</span>
      <span className="v" style={{ color: 'var(--csq-na)' }}>{r.self?.toFixed(1) ?? '—'}</span>
      <span className="v" style={{ color: 'var(--csq-accent)' }}>
        {r.customer?.toFixed(1) ?? '—'}
        {gap !== null && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--csq-muted)', marginLeft: 6 }}>
            {gap > 0 ? `−${gap.toFixed(1)}` : `+${Math.abs(gap).toFixed(1)}`}
          </span>
        )}
      </span>
    </div>
  );
};

export const SelfVsCustomer: FC<{ data: DashboardData }> = ({ data }) => {
  const { overall, current, previous } = data.ratings;
  const gap =
    overall.self !== null && overall.customer !== null ? overall.self - overall.customer : null;

  return (
    <div className="csq-card col-4">
      <h2>Overall Ratings</h2>
      <p className="sub">Your own assessment against your customers&apos;</p>

      <div className="csq-legend">
        <span><i style={{ background: 'var(--csq-na)' }} />Self</span>
        <span><i style={{ background: 'var(--csq-accent)' }} />Customer</span>
      </div>

      <Row name="Overall" r={overall} />
      <Row name="Current cycle" r={current} />
      <Row name="Previous cycle" r={previous} />

      {gap !== null && gap > 0 && (
        <p className="csq-gap">
          You rate yourself <b>{gap.toFixed(1)}</b> higher than your customers do. Self assessment is
          reported back to you but never counts toward the published rating.
        </p>
      )}
    </div>
  );
};
