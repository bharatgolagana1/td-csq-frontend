import type { FC } from 'react';
import type { DashboardData } from '../api/dashboard.types';
import { bandOf } from '../api/dashboard.mock';

const Delta: FC<{ d: number | null }> = ({ d }) => {
  if (d === null) return <span className="dl" style={{ color: 'var(--csq-muted)' }}>—</span>;
  if (d === 0) return <span className="dl" style={{ color: 'var(--csq-muted)' }}>0.0</span>;
  const up = d > 0;
  return (
    <span className="dl" style={{ color: up ? 'var(--csq-up)' : 'var(--csq-down)' }}>
      {up ? '▲' : '▼'} {Math.abs(d).toFixed(1)}
    </span>
  );
};

export const CategoryRatings: FC<{ data: DashboardData }> = ({ data }) => {
  const total = data.categories.reduce((a, c) => a + c.parameterCount, 0);

  return (
    <div className="csq-card col-7">
      <h2>Category Ratings</h2>
      <p className="sub">{total} parameters across {data.categories.length} heads</p>

      <div className="csq-cat csq-cat-head">
        <span>Category</span>
        <span style={{ textAlign: 'right' }}>Current</span>
        <span style={{ textAlign: 'right' }}>Previous</span>
        <span style={{ textAlign: 'right' }}>Change</span>
      </div>

      {data.categories.map((c) => (
        <div className="csq-cat" key={c.code}>
          <span className="nm">
            {c.label} <span className="pc">· {c.parameterCount}</span>
          </span>
          <span className="cur" style={{ color: bandOf(c.current) }}>
            {c.current?.toFixed(1) ?? '—'}
          </span>
          <span className="prv">{c.previous?.toFixed(1) ?? '—'}</span>
          <Delta d={c.delta} />
        </div>
      ))}
    </div>
  );
};
