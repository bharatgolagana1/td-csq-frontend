import { useState, type FC } from 'react';
import type {
  DirectionCode,
  FollowUp,
  Head,
  Parameter,
  RatingValue,
} from '../api/assessmentForm.types';
import { DIRECTION_LABEL, isLowRating, ratingLabel } from '../assessmentForm.logic';
import DirectionRating from './DirectionRating';
import FollowUpBlock from './FollowUpBlock';

export interface QuestionCardProps {
  parameter: Parameter;
  head: Head;
  /** position in the whole instrument, which is what the missing list refers to */
  number: number;
  total: number;
  directions: DirectionCode[];
  ratings: Partial<Record<DirectionCode, RatingValue>>;
  followUps: Partial<Record<DirectionCode, FollowUp>>;
  comment: string;
  onRate: (direction: DirectionCode, value: RatingValue) => void;
  onToggleReason: (direction: DirectionCode, reason: string) => void;
  onNote: (direction: DirectionCode, note: string) => void;
  onComment: (text: string) => void;
  registerDirection: (direction: DirectionCode, el: HTMLDivElement | null) => void;
  targetDirection: DirectionCode | null;
}

const COMMENT_LIMIT = 600;

export const QuestionCard: FC<QuestionCardProps> = ({
  parameter,
  head,
  number,
  total,
  directions,
  ratings,
  followUps,
  comment,
  onRate,
  onToggleReason,
  onNote,
  onComment,
  registerDirection,
  targetDirection,
}) => {
  // a comment already written must never be hidden behind a disclosure
  const [commentOpen, setCommentOpen] = useState(comment.trim().length > 0);
  const commentId = `comment-${parameter.id}`;
  const headingId = `q-${parameter.id}`;

  const answeredCount = directions.filter((d) => ratings[d] !== undefined).length;
  const done = answeredCount === directions.length;

  return (
    <article className="af-q" aria-labelledby={headingId} id={`question-${parameter.id}`}>
      <div className="af-q-meta">
        <span className="af-q-num">
          Q{number}
          <span className="af-q-of"> of {total}</span>
        </span>
        <span className={done ? 'af-q-state is-done' : 'af-q-state'}>
          {done ? 'Answered' : `${answeredCount} of ${directions.length}`}
        </span>
      </div>

      <h3 className="af-q-title" id={headingId}>
        {parameter.shortLabel}
      </h3>
      <p className="af-q-text">{parameter.text}</p>

      <div className="af-directions">
        {directions.map((d) => {
          const value = ratings[d];
          return (
            <div className="af-direction" key={d}>
              <DirectionRating
                parameterId={parameter.id}
                direction={d}
                value={value}
                onChange={(v) => onRate(d, v)}
                groupLabel={`Question ${number}, ${parameter.shortLabel}, ${DIRECTION_LABEL[d]} rating`}
                targeted={targetDirection === d}
                onRegister={(el) => registerDirection(d, el)}
              />
              {value !== undefined && isLowRating(value) ? (
                <FollowUpBlock
                  parameterId={parameter.id}
                  direction={d}
                  ratingWord={ratingLabel(value)}
                  reasons={head.reasons}
                  value={followUps[d]}
                  onToggleReason={(r) => onToggleReason(d, r)}
                  onNote={(n) => onNote(d, n)}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {commentOpen ? (
        <div className="af-comment">
          <label className="af-label" htmlFor={commentId}>
            Comment on this parameter
            <span className="af-optional"> Optional</span>
          </label>
          <textarea
            id={commentId}
            className="af-textarea"
            rows={3}
            maxLength={COMMENT_LIMIT}
            value={comment}
            placeholder="Applies to both directions"
            onChange={(e) => onComment(e.target.value)}
          />
          <p className="af-counter">
            {comment.length} of {COMMENT_LIMIT}
          </p>
        </div>
      ) : (
        <button
          type="button"
          className="af-comment-toggle"
          onClick={() => setCommentOpen(true)}
          aria-expanded={false}
        >
          Add a comment
        </button>
      )}
    </article>
  );
};

export default QuestionCard;
