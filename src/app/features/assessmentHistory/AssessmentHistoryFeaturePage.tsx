import { useCallback, useEffect, useMemo, useRef, useState, type FC, type KeyboardEvent } from 'react';
import Orbis from '../../shared/orbis/Orbis';
import { fetchAssessmentHistory } from './api/history.mock';
import type { AssessmentHistoryData, CommentEntry } from './api/history.types';
import CycleStatusCard from './components/CycleStatusCard';
import HistoryFilters from './components/HistoryFilters';
import IdentityBoundary from './components/IdentityBoundary';
import SubmissionsTable from './components/SubmissionsTable';
import SubmissionDetailPanel from './components/SubmissionDetailPanel';
import CommentsReader from './components/CommentsReader';
import StateCard from './components/StateCard';
import { DIRECTION_LABEL, formatWindowDay } from './lib/labels';
import { exportComments, exportSubmissions } from './lib/exportCsv';
import type { BandFilter, KindFilter, SortDir, SortKey } from './lib/filters';
import { matchesBand, matchesKind, sortRows } from './lib/filters';
import '../../theme/tokens.css';
import './assessmentHistory.css';

type Tab = 'SUBMISSIONS' | 'COMMENTS';
const TABS: Tab[] = ['SUBMISSIONS', 'COMMENTS'];

export const AssessmentHistoryFeaturePage: FC = () => {
  const [cycleId, setCycleId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<AssessmentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [kind, setKind] = useState<KindFilter>('ALL');
  const [band, setBand] = useState<BandFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [tab, setTab] = useState<Tab>('SUBMISSIONS');
  const [openId, setOpenId] = useState<string | null>(null);

  // whatever opened the panel gets focus back when it closes, whichever surface it was
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    fetchAssessmentHistory(cycleId)
      .then((d) => {
        if (!live) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [cycleId, attempt]);

  const openSubmission = useCallback((id: string) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setOpenId(id);
  }, []);

  const closePanel = useCallback(() => {
    setOpenId(null);
    const trigger = triggerRef.current;
    if (trigger && trigger.isConnected) trigger.focus();
  }, []);

  const onSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return;
      }
      setSortKey(key);
      setSortDir(key === 'respondent' ? 'asc' : 'desc');
    },
    [sortKey],
  );

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next);
    document.getElementById(`csqh-tab-${next}`)?.focus();
  };

  const rows = useMemo(() => data?.submissions ?? [], [data]);
  const filtered = useMemo(
    () => rows.filter((r) => matchesKind(r, kind) && matchesBand(r, band)),
    [rows, kind, band],
  );
  const sorted = useMemo(() => sortRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  // comments follow the same filters, so "comments from everyone who rated us Fair" is one selection
  const visibleIds = useMemo(() => new Set(filtered.map((r) => r.id)), [filtered]);
  const visibleComments = useMemo(
    () => (data?.comments ?? []).filter((c) => visibleIds.has(c.submissionId)),
    [data, visibleIds],
  );

  const isFiltered = kind !== 'ALL' || band !== 'ALL';
  const clearFilters = useCallback(() => {
    setKind('ALL');
    setBand('ALL');
  }, []);

  if (failed && !data) {
    return (
      <div className="csqh-page">
        <div className="csqh-center">
          <StateCard
            title="Assessment history did not load"
            body="The service did not answer. Nothing has been lost: responses are held against the cycle and will be here when the connection is back."
            action={
              <button type="button" className="csqh-btn" onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="csqh-page">
        <div className="csqh-center">
          <Orbis label="Loading assessment history" />
        </div>
      </div>
    );
  }

  if (!data.viewer.canViewHistory) {
    return (
      <div className="csqh-page">
        <div className="csqh-center">
          <StateCard
            title="You do not have access to assessment history"
            body="Responses against a terminal are visible to the terminal's own nominated users and to ACFI. Ask your organisation's administrator to add the assessment history permission to your role."
          />
        </div>
      </div>
    );
  }

  const { cycle, terminal, viewer } = data;
  const answerSlots = data.parameterCount * data.directions.length;
  const directionNames = data.directions.map((d) => DIRECTION_LABEL[d]).join(' and ');

  const exportCurrent = () => {
    if (tab === 'SUBMISSIONS') exportSubmissions(sorted, cycle);
    else exportComments(visibleComments, cycle);
  };

  const emptyCycleBody =
    cycle.state === 'SAMPLING'
      ? `Sampling is still open for this cycle. Assessors are invited when the assessment window opens on ${formatWindowDay(cycle.assessmentWindow.start)}, and responses appear here as they are submitted.`
      : cycle.state === 'ASSESSMENT_OPEN'
        ? `Invitations have gone out and the window is open until ${formatWindowDay(cycle.assessmentWindow.end)}. Nobody has submitted yet. Assessors reach the form from a WhatsApp or email link, so the first responses usually arrive within a few days of the invitation.`
        : 'No responses were received against this terminal in this cycle.';

  return (
    <div className="csqh-page">
      <header className="csqh-head">
        <div>
          <div className="csqh-eyebrow">Cargo Service Quality · Assessment history</div>
          <h1>Responses received</h1>
          <p className="csqh-sub">
            {terminal.terminalName}, {terminal.airportName} ({terminal.airportIata}) ·{' '}
            {terminal.scope === 'INTERNATIONAL' ? 'International' : 'Domestic'} terminal, rated on{' '}
            {directionNames}
          </p>
        </div>
        <div className="csqh-head-right">
          <span className="csqh-badge">Illustrative · sample data</span>
          {viewer.canExport ? (
            <button type="button" className="csqh-btn csqh-btn--primary" onClick={exportCurrent}>
              Export {tab === 'SUBMISSIONS' ? 'submissions' : 'comments'} (CSV)
            </button>
          ) : null}
        </div>
      </header>

      <div className={loading ? 'csqh-busy' : undefined} aria-busy={loading}>
        <CycleStatusCard cycle={cycle} submissions={rows} commentCount={data.comments.length} />
      </div>

      <IdentityBoundary canSeeRespondentIdentity={viewer.canSeeRespondentIdentity} />

      <HistoryFilters
        cycles={data.cycles}
        cycleId={cycle.id}
        onCycle={(id) => {
          setOpenId(null);
          setCycleId(id);
        }}
        kind={kind}
        onKind={setKind}
        band={band}
        onBand={setBand}
        summaryLine={`${sorted.length} of ${rows.length} assessments · ${visibleComments.length} comments`}
        isFiltered={isFiltered}
        onClear={clearFilters}
        busy={loading}
      />

      <div className="csqh-tabs" role="tablist" aria-label="Assessment history views" onKeyDown={onTabKeyDown}>
        {TABS.map((t) => (
          <button
            key={t}
            id={`csqh-tab-${t}`}
            type="button"
            role="tab"
            className="csqh-tab"
            aria-selected={tab === t}
            aria-controls={`csqh-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
          >
            {t === 'SUBMISSIONS' ? 'Submissions' : 'Comments'}{' '}
            <span className="csqh-tab-n">{t === 'SUBMISSIONS' ? sorted.length : visibleComments.length}</span>
          </button>
        ))}
      </div>

      <div id={`csqh-panel-${tab}`} role="tabpanel" aria-labelledby={`csqh-tab-${tab}`} tabIndex={-1}>
        {loading ? (
          <div className="csqh-loadpad">
            <Orbis label="Loading the cycle" />
          </div>
        ) : tab === 'SUBMISSIONS' ? (
          rows.length === 0 ? (
            <StateCard title="No submissions in this cycle yet" body={emptyCycleBody} />
          ) : sorted.length === 0 ? (
            <StateCard
              title="No assessments match those filters"
              body="There are responses in this cycle, but none of them is from that kind of assessor in that score band."
              action={
                <button type="button" className="csqh-btn" onClick={clearFilters}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <SubmissionsTable
                rows={sorted}
                answerSlots={answerSlots}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                onOpen={openSubmission}
                openId={openId}
              />
              <p className="csqh-foot">
                Every parameter is answered twice, once for {directionNames}, so a complete response
                carries {answerSlots} ratings across {data.parameterCount} parameters. Not applicable
                answers are excluded from the score rather than counted as a low rating. Your own
                self assessment is reported back to you but never counts toward the published score,
                which is built from the locked customer sample.
              </p>
            </>
          )
        ) : (
          <CommentsReader
            comments={visibleComments}
            canExport={viewer.canExport}
            onExport={(visible: CommentEntry[]) => exportComments(visible, cycle)}
            onOpenSubmission={openSubmission}
          />
        )}
      </div>

      <p className="csqh-foot" style={{ borderTop: '1px solid var(--csq-line)', paddingTop: 14, marginTop: 24 }}>
        Confidential by design. Ratings, comments and rankings are shared with each cargo handling
        agency individually and are not made public at any stage of the exercise. Anything exported
        from this screen carries the same undertaking.
      </p>

      {openId ? (
        <SubmissionDetailPanel
          submissionId={openId}
          canExport={viewer.canExport}
          onClose={closePanel}
        />
      ) : null}
    </div>
  );
};

export default AssessmentHistoryFeaturePage;
