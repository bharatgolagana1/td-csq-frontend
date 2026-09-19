import type { FC } from 'react';
import Orbis from '../../../shared/orbis/Orbis';

export interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  /** what is waiting to be saved, so the bar says something true rather than "unsaved changes" */
  summary: string;
  onSave: () => void;
  onDiscard: () => void;
  blocked?: string | null;
}

export const SaveBar: FC<SaveBarProps> = ({
  dirty, saving, error, savedAt, summary, onSave, onDiscard, blocked,
}) => {
  if (!dirty && !saving && !error && !savedAt) return null;

  return (
    <div className="am-savebar">
      <p>
        {saving ? 'Saving' : error ? <span className="am-msg am-msg--bad">{error}</span>
          : dirty ? summary
          : <span className="am-msg am-msg--ok">Saved {savedAt}</span>}
        {blocked && dirty && !saving ? <span className="am-blocked"> · {blocked}</span> : null}
      </p>
      <div className="am-actions">
        {saving && <Orbis size={7} />}
        {dirty && !saving && (
          <>
            <button type="button" className="am-btn" onClick={onDiscard}>
              Discard
            </button>
            <button
              type="button"
              className="am-btn am-btn--primary"
              onClick={onSave}
              disabled={Boolean(blocked)}
            >
              Save changes
            </button>
          </>
        )}
      </div>
    </div>
  );
};
