import type { FC } from 'react';
import type { DirectionCode, FollowUp } from '../api/assessmentForm.types';
import { DIRECTION_LABEL } from '../assessmentForm.logic';

export interface FollowUpBlockProps {
  parameterId: string;
  direction: DirectionCode;
  /** the word for the rating that opened this block, Fair or Poor */
  ratingWord: string;
  reasons: string[];
  value: FollowUp | undefined;
  onToggleReason: (reason: string) => void;
  onNote: (note: string) => void;
}

const NOTE_LIMIT = 400;

/**
 * Opens only on Fair or Poor, and says why it opened. It stays optional: a low
 * rating with no explanation is still a signal worth having, and a required
 * text box on a phone is where a half finished assessment gets abandoned.
 */
export const FollowUpBlock: FC<FollowUpBlockProps> = ({
  parameterId,
  direction,
  ratingWord,
  reasons,
  value,
  onToggleReason,
  onNote,
}) => {
  const noteId = `note-${parameterId}-${direction}`;
  const chosen = value?.reasons ?? [];
  const note = value?.note ?? '';

  return (
    <div className="af-followup">
      <p className="af-followup-why">
        You rated <strong>{DIRECTION_LABEL[direction]}</strong> as {ratingWord}. A reason helps the
        terminal act on it. Optional.
      </p>

      <div className="af-chips" role="group" aria-label={`Reasons for the ${DIRECTION_LABEL[direction]} rating`}>
        {reasons.map((r) => {
          const on = chosen.includes(r);
          return (
            <button
              key={r}
              type="button"
              className={on ? 'af-chip is-on' : 'af-chip'}
              aria-pressed={on}
              onClick={() => onToggleReason(r)}
            >
              {r}
            </button>
          );
        })}
      </div>

      <label className="af-label" htmlFor={noteId}>
        Anything specific worth recording
      </label>
      <textarea
        id={noteId}
        className="af-textarea"
        rows={3}
        maxLength={NOTE_LIMIT}
        value={note}
        placeholder="For example, which shift, which month, or what was tried"
        onChange={(e) => onNote(e.target.value)}
      />
      <p className="af-counter">
        {note.length} of {NOTE_LIMIT}
      </p>
    </div>
  );
};

export default FollowUpBlock;
