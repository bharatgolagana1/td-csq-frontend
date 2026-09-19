import { useCallback, useEffect, useMemo, useReducer, useState, type FC } from 'react';
import { useParams } from 'react-router-dom';
import Orbis from '../../shared/orbis/Orbis';
import { CYCLE_NOT_FOUND, fetchCycleBuilder, saveCycleDraft, scheduleCycle } from './api/cycleBuilder.mock';
import type {
  AssessorKind,
  CycleBuilderBootstrap,
  CycleDraft,
  ReminderDraft,
  ZonedDateTime,
} from './api/cycleBuilder.types';
import { buildTimeline, editPolicyFor, errorsIn, validateCycle } from './lib/cycleRules';
import { buildSendPlan } from './lib/sendPlan';
import { formatWallDateTime, withZone } from './lib/zonedTime';
import { ChecksPanel } from './components/ChecksPanel';
import { CycleIdentity } from './components/CycleIdentity';
import { CycleTimeline } from './components/CycleTimeline';
import { ReminderPlanner } from './components/ReminderPlanner';
import { ScheduleGate, type GateBusy } from './components/ScheduleGate';
import { SendPreview } from './components/SendPreview';
import { StateBanner, StateChip } from './components/StateBanner';
import { WindowFields } from './components/WindowFields';
import '../../theme/tokens.css';
import './cycleBuilder.css';

const EMPTY_ZONED: ZonedDateTime = { date: '', time: '', timeZone: 'Asia/Kolkata' };

const EMPTY_DRAFT: CycleDraft = {
  id: null,
  state: 'DRAFT',
  name: '',
  programmeId: '',
  formScopeId: '',
  minSamplingSize: null,
  timeZone: 'Asia/Kolkata',
  samplingOpens: EMPTY_ZONED,
  samplingCloses: EMPTY_ZONED,
  assessmentOpens: EMPTY_ZONED,
  assessmentCloses: EMPTY_ZONED,
  reminders: [],
};

interface BuilderState {
  draft: CycleDraft;
  /** the cycle as loaded, so extend only rules have something to compare against */
  baseline: CycleDraft;
  confirmed: boolean;
}

type Action =
  | { type: 'LOAD'; draft: CycleDraft }
  | { type: 'PATCH'; patch: Partial<CycleDraft> }
  | { type: 'TIMEZONE'; timeZone: string }
  | { type: 'ADD_REMINDER'; reminder: ReminderDraft }
  | { type: 'UPDATE_REMINDER'; id: string; patch: Partial<ReminderDraft> }
  | { type: 'REMOVE_REMINDER'; id: string }
  | { type: 'CONFIRM'; value: boolean }
  | { type: 'SCHEDULED'; cycleId: string };

function reduce(state: BuilderState, action: Action): BuilderState {
  switch (action.type) {
    case 'LOAD':
      return { draft: action.draft, baseline: action.draft, confirmed: false };

    // every edit drops the confirmation: nobody gets to tick the box, change a
    // date and still be holding a confirmation of what they read
    case 'PATCH':
      return { ...state, draft: { ...state.draft, ...action.patch }, confirmed: false };

    case 'TIMEZONE':
      return {
        ...state,
        confirmed: false,
        draft: {
          ...state.draft,
          timeZone: action.timeZone,
          samplingOpens: withZone(state.draft.samplingOpens, action.timeZone),
          samplingCloses: withZone(state.draft.samplingCloses, action.timeZone),
          assessmentOpens: withZone(state.draft.assessmentOpens, action.timeZone),
          assessmentCloses: withZone(state.draft.assessmentCloses, action.timeZone),
          reminders: state.draft.reminders.map((r) =>
            r.alreadySent ? r : { ...r, at: withZone(r.at, action.timeZone) },
          ),
        },
      };

    case 'ADD_REMINDER':
      return {
        ...state,
        confirmed: false,
        draft: { ...state.draft, reminders: [...state.draft.reminders, action.reminder] },
      };

    case 'UPDATE_REMINDER':
      return {
        ...state,
        confirmed: false,
        draft: {
          ...state.draft,
          reminders: state.draft.reminders.map((r) =>
            r.id === action.id ? { ...r, ...action.patch } : r,
          ),
        },
      };

    case 'REMOVE_REMINDER':
      return {
        ...state,
        confirmed: false,
        draft: { ...state.draft, reminders: state.draft.reminders.filter((r) => r.id !== action.id) },
      };

    case 'CONFIRM':
      return { ...state, confirmed: action.value };

    case 'SCHEDULED': {
      const draft: CycleDraft = { ...state.draft, id: action.cycleId, state: 'SCHEDULED' };
      return { draft, baseline: draft, confirmed: false };
    }

    default:
      return state;
  }
}

const INITIAL: BuilderState = { draft: EMPTY_DRAFT, baseline: EMPTY_DRAFT, confirmed: false };

const DEFAULT_AUDIENCES: AssessorKind[] = ['CUSTOMER'];

let reminderSeq = 0;

export const CycleBuilderPage: FC = () => {
  const { cycleId } = useParams<{ cycleId?: string }>();
  const [bootstrap, setBootstrap] = useState<CycleBuilderBootstrap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, dispatch] = useReducer(reduce, INITIAL);
  const [busy, setBusy] = useState<GateBusy>('none');
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // validation talks about the past, so it needs a clock that moves
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let live = true;
    setBootstrap(null);
    setLoadError(null);
    fetchCycleBuilder(cycleId)
      .then((data) => {
        if (!live) return;
        setBootstrap(data);
        dispatch({ type: 'LOAD', draft: data.draft });
      })
      .catch((err: unknown) => {
        if (!live) return;
        setLoadError(
          err instanceof Error && err.message === CYCLE_NOT_FOUND
            ? 'No cycle exists with that reference. It may have been removed.'
            : 'Could not load the cycle builder.',
        );
      });
    return () => {
      live = false;
    };
  }, [cycleId, attempt]);

  const { draft, baseline, confirmed } = state;

  const programme = useMemo(
    () => bootstrap?.programmes.find((p) => p.id === draft.programmeId),
    [bootstrap, draft.programmeId],
  );
  const scope = useMemo(
    () => bootstrap?.formScopes.find((f) => f.id === draft.formScopeId),
    [bootstrap, draft.formScopeId],
  );
  const policy = useMemo(() => editPolicyFor(draft.state), [draft.state]);
  const issues = useMemo(
    () => validateCycle({ draft, baseline, programme, nowMs }),
    [draft, baseline, programme, nowMs],
  );
  const timeline = useMemo(() => buildTimeline(draft, nowMs), [draft, nowMs]);
  const plan = useMemo(
    () => buildSendPlan({ draft, audiences: bootstrap?.audiences ?? [], programme, scope }),
    [draft, bootstrap, programme, scope],
  );

  const errorCount = errorsIn(issues).length;

  const handleChange = useCallback((patch: Partial<CycleDraft>) => {
    setStatusNote(null);
    setSubmitError(null);
    dispatch({ type: 'PATCH', patch });
  }, []);

  const handleAddReminder = useCallback((at: ZonedDateTime) => {
    reminderSeq += 1;
    dispatch({
      type: 'ADD_REMINDER',
      reminder: {
        id: `r-new-${reminderSeq}`,
        at,
        audiences: DEFAULT_AUDIENCES,
        channel: 'WHATSAPP_AND_EMAIL',
        alreadySent: false,
      },
    });
  }, []);

  const handleSave = useCallback(() => {
    setBusy('saving');
    setSubmitError(null);
    saveCycleDraft(draft)
      .then(() => setStatusNote('Saved. Nothing has been sent.'))
      .catch(() => setSubmitError('Could not save. Nothing was changed.'))
      .finally(() => setBusy('none'));
  }, [draft]);

  const handleSchedule = useCallback(() => {
    setBusy('scheduling');
    setSubmitError(null);
    scheduleCycle(draft, plan.length)
      .then((result) => {
        dispatch({ type: 'SCHEDULED', cycleId: result.cycleId });
        setStatusNote(
          `Scheduled. ${result.sendCount} message${result.sendCount === 1 ? '' : 's'} queued and the cycle is now fixed.`,
        );
      })
      .catch(() => setSubmitError('Could not schedule the cycle. Nothing was queued.'))
      .finally(() => setBusy('none'));
  }, [draft, plan.length]);

  if (loadError) {
    return (
      <div className="csq-cb csq-cb-center">
        <div className="cb-card cb-notice">
          <h2>{loadError}</h2>
          <p>The builder holds no unsaved work, so retrying costs nothing.</p>
          <button type="button" className="cb-btn cb-btn--primary" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="csq-cb csq-cb-center">
        <Orbis label="Loading the cycle builder" />
      </div>
    );
  }

  if (!bootstrap.viewer.canManageCycles) {
    return (
      <div className="csq-cb csq-cb-center">
        <div className="cb-card cb-notice">
          <h2>Cycle setup is not open to your role</h2>
          <p>
            You are signed in as <b>{bootstrap.viewer.name}</b>, {bootstrap.viewer.role}. Assessment
            cycles are defined by the ACFI secretariat, because the dates decide whose ratings count
            toward a published score.
          </p>
          <p>
            If a cycle date is a problem for your terminal, ask the secretariat rather than working
            around it. Nothing on this screen would be visible to your customers in any case.
          </p>
        </div>
      </div>
    );
  }

  const firstSend = plan.length > 0 ? formatWallDateTime(plan[0].at, false) : null;

  return (
    <div className="csq-cb">
      <header className="cb-head">
        <div>
          <div className="cb-eyebrow">Cargo Service Quality · ACFI secretariat</div>
          <h1>{draft.id === null ? 'New assessment cycle' : draft.name || 'Assessment cycle'}</h1>
        </div>
        <div className="cb-head-right">
          <span className="cb-sample">Illustrative · sample data</span>
          <StateChip state={draft.state} />
        </div>
      </header>

      <StateBanner state={draft.state} policy={policy} prefilledFrom={bootstrap.prefilledFrom} />

      <div className="cb-stack">
        <CycleIdentity
          draft={draft}
          programmes={bootstrap.programmes}
          formScopes={bootstrap.formScopes}
          programme={programme}
          scope={scope}
          policy={policy}
          issues={issues}
          onChange={handleChange}
        />

        <WindowFields
          draft={draft}
          timeZones={bootstrap.timeZones}
          policy={policy}
          issues={issues}
          onChange={handleChange}
          onTimeZoneChange={(timeZone) => dispatch({ type: 'TIMEZONE', timeZone })}
        />

        <div className="cb-pair">
          <CycleTimeline draft={draft} model={timeline} nowMs={nowMs} />
          <ChecksPanel issues={issues} />
        </div>

        <ReminderPlanner
          draft={draft}
          audiences={bootstrap.audiences}
          policy={policy}
          issues={issues}
          onAdd={handleAddReminder}
          onUpdate={(id, patch) => dispatch({ type: 'UPDATE_REMINDER', id, patch })}
          onRemove={(id) => dispatch({ type: 'REMOVE_REMINDER', id })}
        />

        <SendPreview
          plan={plan}
          timeZone={draft.timeZone}
          overlapping={timeline?.overlap !== null && timeline?.overlap !== undefined}
        />

        <ScheduleGate
          state={draft.state}
          policy={policy}
          errorCount={errorCount}
          sendCount={plan.length}
          firstSendLabel={firstSend}
          confirmed={confirmed}
          busy={busy}
          statusNote={statusNote}
          submitError={submitError}
          onConfirm={(value) => dispatch({ type: 'CONFIRM', value })}
          onSaveDraft={handleSave}
          onSchedule={handleSchedule}
        />
      </div>

      <p className="cb-conf">
        Confidential by design. Ratings collected in this cycle are shared with each cargo handling
        agency individually and are not made public at any stage of the exercise.
      </p>
    </div>
  );
};

export default CycleBuilderPage;
