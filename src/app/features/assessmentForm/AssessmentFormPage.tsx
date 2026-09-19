import { useCallback, useEffect, useState, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import Orbis from '../../shared/orbis/Orbis';
import { fetchAssessmentSession, parseDemoState } from './api/assessmentForm.mock';
import type { AssessmentSession } from './api/assessmentForm.types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import AssessmentForm from './components/AssessmentForm';
import BlockedPanel from './components/BlockedPanel';
import '../../theme/tokens.css';
import './assessmentForm.css';

/**
 * The assessor reaches this page from a WhatsApp or email link, on a phone,
 * signed in to nothing. Everything it needs comes from the token in the link,
 * so the page owns its own gates rather than relying on app chrome.
 */
export const AssessmentFormPage: FC = () => {
  const [params] = useSearchParams();
  const token = params.get('t') ?? 'demo';
  const demo = parseDemoState(params.get('state'));
  const online = useOnlineStatus();

  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setSession(null);
    setFailed(false);
    fetchAssessmentSession(token, demo)
      .then((s) => {
        if (live) setSession(s);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [token, demo, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (failed) {
    return (
      <div className="af-shell af-state">
        <div className="af-state-card">
          <div className="af-eyebrow">Cargo Service Quality assessment</div>
          <h1>We could not open your assessment</h1>
          <p className="af-state-lede">
            {online
              ? 'Something went wrong at our end. Nothing you have answered before has been lost.'
              : 'You appear to be offline. Reconnect and try again. Any draft you saved is still on this phone.'}
          </p>
          <button type="button" className="af-btn af-btn--primary" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="af-shell af-center">
        <Orbis label="Opening your assessment" />
      </div>
    );
  }

  if (session.status === 'BLOCKED') {
    return (
      <div className="af-shell">
        <BlockedPanel block={session.block} />
      </div>
    );
  }

  // an approved cycle with no published instrument: rare, but it reaches the
  // assessor as a blank page unless it is named
  if (session.instrument.parameters.length === 0 || session.instrument.heads.length === 0) {
    return (
      <div className="af-shell af-state">
        <div className="af-state-card">
          <div className="af-eyebrow">Cargo Service Quality · {session.instrument.cycleLabel}</div>
          <h1>No questions have been published yet</h1>
          <p className="af-state-lede">
            The questionnaire for this cycle is not ready. Keep this link. It will work as soon as
            ACFI publishes the parameters, and you will get a reminder.
          </p>
          <button type="button" className="af-btn af-btn--ghost" onClick={retry}>
            Check again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="af-shell">
      <AssessmentForm
        token={token}
        invite={session.invite}
        instrument={session.instrument}
        initialDraft={session.draft}
        online={online}
      />
    </div>
  );
};

export default AssessmentFormPage;
