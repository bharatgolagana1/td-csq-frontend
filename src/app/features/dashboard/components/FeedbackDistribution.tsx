import type { FC } from 'react';
import type { DashboardData } from '../api/dashboard.types';
import { RATING_VAR } from '../api/dashboard.mock';

export const FeedbackDistribution: FC<{ data: DashboardData }> = ({ data }) => {
  const { totalResponses, distribution } = data.feedback;
  const max = Math.max(...distribution.map((d) => d.percent), 1);

  return (
    <div className="csq-card col-5">
      <h2>Feedback Overview</h2>
      <p className="sub">{totalResponses.toLocaleString('en-IN')} responses this cycle</p>

      {distribution.map((d) => (
        <div className="csq-dist-row" key={d.key}>
          <span className="k">{d.label}</span>
          <span className="csq-bar">
            {/* scaled to the largest band so small bands stay visible */}
            <span style={{ width: `${(d.percent / max) * 100}%`, background: RATING_VAR[d.key] }} />
          </span>
          <span className="n">
            {d.count} · {d.percent}%
          </span>
        </div>
      ))}
    </div>
  );
};
