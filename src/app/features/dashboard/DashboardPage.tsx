import { useEffect, useState, type FC } from 'react';
import Orbis from '../../shared/orbis/Orbis';
import { fetchDashboard } from './api/dashboard.mock';
import type { DashboardData } from './api/dashboard.types';
import { ScoreHero } from './components/ScoreHero';
import { SelfVsCustomer } from './components/SelfVsCustomer';
import { FeedbackDistribution } from './components/FeedbackDistribution';
import { CategoryRatings } from './components/CategoryRatings';
import { RankingsTable } from './components/RankingsTable';
import '../../theme/tokens.css';
import './dashboard.css';

export const DashboardPage: FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchDashboard()
      .then((d) => { if (live) setData(d); })
      .catch(() => { if (live) setError('Could not load the dashboard.'); });
    return () => { live = false; };
  }, []);

  if (error) {
    return (
      <div className="csq-dash csq-center">
        <p style={{ color: 'var(--csq-muted)' }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="csq-dash csq-center">
        <Orbis label="Loading your dashboard" />
      </div>
    );
  }

  return (
    <div className="csq-dash">
      <header className="csq-head">
        <div>
          <div className="csq-eyebrow">Cargo Service Quality · Pan-India</div>
          <h1>Dashboard</h1>
        </div>
        <div className="csq-ctl">
          <span className="csq-sample">Illustrative · sample data</span>
          <select className="csq-select" defaultValue={data.cycle.id} aria-label="Assessment cycle">
            <option value={data.cycle.id}>{data.cycle.label}</option>
          </select>
        </div>
      </header>

      <div className="csq-grid">
        <ScoreHero data={data} />
        <SelfVsCustomer data={data} />
        <FeedbackDistribution data={data} />
        <CategoryRatings data={data} />
        <RankingsTable data={data} />
      </div>

      {/* ACFI's stated commitment, kept visible rather than buried in a policy page */}
      <p className="csq-conf">
        Confidential by design. Scores and ratings are shared with each cargo handling agency
        individually and are not made public at any stage of the exercise.
      </p>
    </div>
  );
};

export default DashboardPage;
