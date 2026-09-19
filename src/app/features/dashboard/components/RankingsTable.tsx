import type { FC } from 'react';
import type { DashboardData } from '../api/dashboard.types';
import { bandOf } from '../api/dashboard.mock';

export const RankingsTable: FC<{ data: DashboardData }> = ({ data }) => (
  <div className="csq-card col-5">
    <h2>All-India Ratings &amp; Rankings</h2>
    <p className="sub">Your position against every terminal in the programme</p>

    <div className="csq-rank-row csq-cat-head" style={{ borderBottom: '1px solid var(--csq-line-2)' }}>
      <span>Rank</span>
      <span>Airport · Cargo Terminal</span>
      <span style={{ textAlign: 'right' }}>Rating</span>
    </div>

    {data.rankings.rows.map((r) => (
      <div className={r.isSelf ? 'csq-rank-row is-self' : 'csq-rank-row'} key={r.airportIata}>
        <span className="rk">{String(r.rank).padStart(2, '0')}</span>
        <span>
          {r.airportName}
          <span className="iata">{r.airportIata}</span>
          {r.isSelf && (
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--csq-accent)', marginLeft: 8 }}>
              YOU
            </span>
          )}
        </span>
        <span className="rt" style={{ color: bandOf(r.rating) }}>{r.rating?.toFixed(1) ?? '—'}</span>
      </div>
    ))}

    <p className="csq-foot">{data.rankings.footnote}</p>
  </div>
);
