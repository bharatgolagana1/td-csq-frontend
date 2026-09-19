import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import Orbis from '../../shared/orbis/Orbis';
import {
  fetchAdminMaster,
  fetchAdminSession,
  publishDraft,
  saveAssessorWeights,
  saveDraft,
  saveOperators,
} from './api/adminMaster.mock';
import type {
  AdminMasterData,
  AdminSession,
  AssessorWeight,
  InstrumentVersion,
  Operator,
} from './api/adminMaster.types';
import { blockingOf, poolForAirport, validateDraft } from './adminMaster.logic';
import { OperatorsPanel } from './components/OperatorsPanel';
import { QuestionBankPanel } from './components/QuestionBankPanel';
import { WeightagePanel } from './components/WeightagePanel';
import { TabBar, type TabDef } from './components/TabBar';
import '../../theme/tokens.css';
import './adminMaster.css';

type TabId = 'operators' | 'questions' | 'weightage';

const TAB_IDS: TabId[] = ['operators', 'questions', 'weightage'];

function isSame(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function stamp(): string {
  return `at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export const AdminMasterPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleHint = searchParams.get('as');
  const rawTab = searchParams.get('tab');
  const tab: TabId = TAB_IDS.includes(rawTab as TabId) ? (rawTab as TabId) : 'operators';

  const [session, setSession] = useState<AdminSession | null>(null);
  const [base, setBase] = useState<AdminMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // working copies: everything edits these, and the baseline above says what is dirty
  const [operators, setOperators] = useState<Operator[]>([]);
  const [draft, setDraft] = useState<InstrumentVersion | null>(null);
  const [assessorWeights, setAssessorWeights] = useState<AssessorWeight[]>([]);

  const [savingOps, setSavingOps] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [opsSavedAt, setOpsSavedAt] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const [savingInstrument, setSavingInstrument] = useState(false);
  const [instrumentError, setInstrumentError] = useState<string | null>(null);
  const [instrumentSavedAt, setInstrumentSavedAt] = useState<string | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);

  // a save confirmation is news for a moment, not a permanent bar at the foot of the page
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const flashSaved = useCallback((set: (value: string | null) => void) => {
    set(stamp());
    timers.current.push(window.setTimeout(() => set(null), 6000));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const s = await fetchAdminSession(roleHint);
      setSession(s);
      if (s.role !== 'SUPER_ADMIN') {
        setLoading(false);
        return;
      }
      const data = await fetchAdminMaster();
      setBase(data);
      setOperators(data.operators);
      setDraft(data.draft);
      setAssessorWeights(data.assessorWeights);
    } catch {
      setLoadError('Master data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [roleHint]);

  useEffect(() => {
    let live = true;
    void (async () => {
      await load();
      if (!live) return;
    })();
    return () => {
      live = false;
    };
  }, [load]);

  const setTab = (next: TabId) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const opsDirty = base ? !isSame(base.operators, operators) : false;
  const instrumentDirty = Boolean(
    base && draft && (!isSame(base.draft, draft) || !isSame(base.assessorWeights, assessorWeights)),
  );

  const issues = useMemo(
    () => (draft ? validateDraft(draft, assessorWeights) : []),
    [draft, assessorWeights],
  );

  const unsettledAirports = useMemo(() => {
    if (!base) return 0;
    return base.airports.filter((a) => {
      const pool = poolForAirport(operators, a.id);
      return pool.members.length > 0 && !pool.balanced;
    }).length;
  }, [base, operators]);

  const pendingCount = operators.filter((o) => o.state === 'PENDING_APPROVAL').length;

  const persistOperators = async (next: Operator[]) => {
    setOpsError(null);
    const saved = await saveOperators(next);
    setOperators(saved);
    setBase((b) => (b ? { ...b, operators: saved } : b));
    flashSaved(setOpsSavedAt);
  };

  const handleSaveOperators = async () => {
    setSavingOps(true);
    try {
      await persistOperators(operators);
    } catch {
      setOpsError('Could not save. Nothing was changed.');
    } finally {
      setSavingOps(false);
    }
  };

  /** approving or declining a registration is a decision, not a draft, so it commits at once */
  const handleDecide = async (id: string, patch: Partial<Operator>) => {
    setDecidingId(id);
    try {
      await persistOperators(operators.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    } catch {
      setOpsError('Could not record that decision. The registration is untouched.');
    } finally {
      setDecidingId(null);
    }
  };

  const handleSaveInstrument = async () => {
    if (!draft) return;
    setSavingInstrument(true);
    setInstrumentError(null);
    try {
      const [savedDraft, savedWeights] = await Promise.all([
        saveDraft(draft),
        saveAssessorWeights(assessorWeights),
      ]);
      setDraft(savedDraft);
      setAssessorWeights(savedWeights);
      setBase((b) => (b ? { ...b, draft: savedDraft, assessorWeights: savedWeights } : b));
      flashSaved(setInstrumentSavedAt);
    } catch {
      setInstrumentError('Could not save the draft. Your edits are still on screen.');
    } finally {
      setSavingInstrument(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const result = await publishDraft(draft);
      setDraft(result.draft);
      setBase((b) => (b ? { ...b, live: result.live, draft: result.draft } : b));
      setPublishNotice(
        `${result.live.label} is now the live instrument. Draft ${result.draft.label} was forked from it for the next round of edits.`,
      );
    } catch {
      setPublishError('Publishing failed. The live instrument is unchanged.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="am am-center">
        <Orbis label="Loading master data" />
      </div>
    );
  }

  if (session && session.role !== 'SUPER_ADMIN') {
    return (
      <div className="am">
        <div className="am-deny">
          <h1>Master data is Super Admin only</h1>
          <p>
            Operators, the question bank and weighting decide how every terminal in the programme is
            scored, so they sit with ACFI rather than with the terminals being assessed.
          </p>
          <p>
            You are signed in as {session.userName}
            {session.role === 'ACO_ADMIN'
              ? ', a terminal administrator. Your customer list and your own dashboard are open to you.'
              : ', an assessor. Your assessments are open to you.'}
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !base || !draft) {
    return (
      <div className="am">
        <section className="am-card am-error">
          <h2>Master data could not be loaded</h2>
          <p className="sub">
            {loadError ?? 'The response was empty.'} Nothing has been changed. Try again, and if it keeps
            failing the API is likely down rather than your session.
          </p>
          <button type="button" className="am-btn am-btn--primary" onClick={() => void load()}>
            Try again
          </button>
        </section>
      </div>
    );
  }

  const tabs: Array<TabDef<TabId>> = [
    { id: 'operators', label: 'Operators', count: pendingCount },
    { id: 'questions', label: 'Question bank', count: blockingOf(issues).length },
    { id: 'weightage', label: 'Weightage' },
  ];

  return (
    <div className="am">
      <header className="am-head">
        <div>
          <div className="am-eyebrow">Cargo Service Quality · Super Admin</div>
          <h1>Master data</h1>
        </div>
        <div className="am-ctl">
          <span className="am-sample">Illustrative · sample data</span>
          {session && (
            <span className="am-who">
              Signed in as <b>{session.userName}</b>
            </span>
          )}
        </div>
      </header>

      <TabBar tabs={tabs} active={tab} onChange={setTab} label="Master data sections" />

      {publishNotice && (
        <p className="am-card am-msg am-msg--ok" role="status">
          {publishNotice}
        </p>
      )}

      <div id={`am-panel-${tab}`} role="tabpanel" aria-labelledby={`am-tab-${tab}`} tabIndex={-1}>
        {tab === 'operators' && (
          <OperatorsPanel
            operators={operators}
            airports={base.airports}
            onChange={setOperators}
            onDecide={(id, patch) => void handleDecide(id, patch)}
            decidingId={decidingId}
            dirty={opsDirty}
            saving={savingOps}
            error={opsError}
            savedAt={opsSavedAt}
            onSave={() => void handleSaveOperators()}
            onDiscard={() => setOperators(base.operators)}
          />
        )}

        {tab === 'questions' && (
          <QuestionBankPanel
            live={base.live}
            draft={draft}
            issues={issues}
            onChangeDraft={setDraft}
            dirty={instrumentDirty}
            saving={savingInstrument}
            error={instrumentError}
            savedAt={instrumentSavedAt}
            onSave={() => void handleSaveInstrument()}
            onDiscard={() => {
              setDraft(base.draft);
              setAssessorWeights(base.assessorWeights);
            }}
            publishing={publishing}
            publishError={publishError}
            onPublish={() => void handlePublish()}
            openCycle={base.openCycle}
          />
        )}

        {tab === 'weightage' && (
          <WeightagePanel
            draft={draft}
            onChangeDraft={setDraft}
            assessorWeights={assessorWeights}
            onChangeAssessorWeights={setAssessorWeights}
            unsettledAirports={unsettledAirports}
            onGoToOperators={() => setTab('operators')}
            dirty={instrumentDirty}
            saving={savingInstrument}
            error={instrumentError}
            savedAt={instrumentSavedAt}
            onSave={() => void handleSaveInstrument()}
            onDiscard={() => {
              setDraft(base.draft);
              setAssessorWeights(base.assessorWeights);
            }}
          />
        )}
      </div>

      {/* ACFI's stated commitment, kept on screen rather than buried in a policy page */}
      <p className="am-conf">
        Confidential by design. Master data decides how ratings are produced, never who sees them:
        scores and ratings are shared with each cargo handling agency individually and are not made
        public at any stage of the exercise.
      </p>
    </div>
  );
};

export default AdminMasterPage;
