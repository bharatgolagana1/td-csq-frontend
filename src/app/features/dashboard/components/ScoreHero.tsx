import type { FC } from 'react';
import type { DashboardData } from '../api/dashboard.types';
import { bandOf } from '../api/dashboard.mock';

const SUPPRESSION_COPY: Record<string, string> = {
  BELOW_MIN_RESPONSES: 'Too few responses to publish a rating for this cycle.',
  BELOW_MIN_COVERAGE: 'Too little of the instrument was answered to publish a rating.',
  NOT_YET_SCORED: 'This cycle has not been scored yet.',
};

export const ScoreHero: FC<{ data: DashboardData }> = ({ data }) => {
  const { overall, terminal } = data;
  const suppressed = overall.value === null;

  return (
    <div className="csq-card col-3 csq-hero">
      <div className="csq-eyebrow">Selected CTO</div>
      <div style={{ fontSize: 15, fontWeight: 800 }}>
        {terminal.airportName} <span style={{ color: 'var(--csq-muted)' }}>({terminal.airportIata})</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--csq-muted)', marginBottom: 18 }}>
        {terminal.airportFullName}
      </div>

      {suppressed ? (
        <p className="csq-suppressed">
          {SUPPRESSION_COPY[overall.suppression] ?? 'No rating available.'}
        </p>
      ) : (
        <>
          <div className="score" style={{ color: bandOf(overall.value) }}>
            {overall.value!.toFixed(1)}
            <span className="of5">/ 5</span>
          </div>
          <div className="lbl">Overall rating</div>
        </>
      )}

      <div className="csq-rank">
        <span style={{ color: 'var(--csq-muted)' }}>Rank</span>
        <span>
          <b>{overall.rank ?? '—'}</b>
          <span style={{ color: 'var(--csq-muted)' }}> of {overall.rankOf}</span>
        </span>
      </div>
      <div className="csq-rank" style={{ marginTop: 0, paddingTop: 10 }}>
        <span style={{ color: 'var(--csq-muted)' }}>Assessments</span>
        <span>
          <b>{overall.assessmentCount}</b>
          <span style={{ color: 'var(--csq-muted)' }}>
            {' '}· {overall.selfCount} self · {overall.customerCount} customer
          </span>
        </span>
      </div>
    </div>
  );
};
