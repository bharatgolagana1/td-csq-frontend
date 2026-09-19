import { useId, useMemo, useState, type FC } from 'react';
import type { CategoryCode, CommentEntry, Sentiment } from '../api/history.types';
import { ASSESSOR_TYPE_LABEL, CATEGORY_LABEL, CATEGORY_ORDER, DIRECTION_LABEL, formatDay } from '../lib/labels';
import { SENTIMENT_COLOUR, SENTIMENT_LABEL, SENTIMENT_ORDER } from '../lib/scoring';
import { Dot, RatingTag } from './Pills';
import StateCard from './StateCard';

type SentimentFilter = 'ALL' | Sentiment;
type GroupBy = 'CATEGORY' | 'SENTIMENT';

interface Props {
  comments: CommentEntry[];
  canExport: boolean;
  onExport: (visible: CommentEntry[]) => void;
  onOpenSubmission: (id: string) => void;
}

/** Critical first, then newest. The comment that costs the operator something is the one to read. */
function readingOrder(a: CommentEntry, b: CommentEntry): number {
  const bySentiment = SENTIMENT_ORDER.indexOf(a.sentiment) - SENTIMENT_ORDER.indexOf(b.sentiment);
  if (bySentiment !== 0) return bySentiment;
  return b.submittedAt.localeCompare(a.submittedAt);
}

const Quote: FC<{ comment: CommentEntry; onOpen: (id: string) => void }> = ({ comment, onOpen }) => (
  <div className="csqh-quote" style={{ borderLeftColor: SENTIMENT_COLOUR[comment.sentiment] }}>
    <p className="csqh-quote-q">
      {String(comment.parameterNo).padStart(2, '0')} · {comment.question}
    </p>
    <blockquote>{comment.text}</blockquote>
    <div className="csqh-quote-meta">
      <RatingTag rating={comment.rating} showValue={false} />
      <Dot />
      <span>{DIRECTION_LABEL[comment.direction]}</span>
      <Dot />
      <span>
        {comment.respondent.reference} ({ASSESSOR_TYPE_LABEL[comment.respondent.type].toLowerCase()})
      </span>
      <Dot />
      <span className="csqh-num">{formatDay(comment.submittedAt)}</span>
      <Dot />
      <button
        type="button"
        className="csqh-rowbtn"
        onClick={() => onOpen(comment.submissionId)}
        aria-label={`Open the full response ${comment.submissionId}`}
      >
        {comment.submissionId}
      </button>
    </div>
  </div>
);

/**
 * Comments get their own surface because a table row buries them. The rating
 * decides the tone, so grouping by tone is grouping by fact rather than by a
 * guess at what the words mean.
 */
export const CommentsReader: FC<Props> = ({ comments, canExport, onExport, onOpenSubmission }) => {
  const [sentiment, setSentiment] = useState<SentimentFilter>('ALL');
  const [groupBy, setGroupBy] = useState<GroupBy>('CATEGORY');
  const [query, setQuery] = useState('');
  const searchId = useId();
  const groupId = useId();

  const counts = useMemo(() => {
    const out: Record<Sentiment, number> = { CRITICAL: 0, NEUTRAL: 0, POSITIVE: 0, UNRATED: 0 };
    comments.forEach((c) => {
      out[c.sentiment] += 1;
    });
    return out;
  }, [comments]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return comments
      .filter((c) => sentiment === 'ALL' || c.sentiment === sentiment)
      .filter(
        (c) =>
          needle === '' ||
          c.text.toLowerCase().includes(needle) ||
          c.question.toLowerCase().includes(needle),
      )
      .sort(readingOrder);
  }, [comments, sentiment, query]);

  const groups = useMemo(() => {
    if (groupBy === 'SENTIMENT') {
      return SENTIMENT_ORDER.map((key) => ({
        key: key as string,
        label: SENTIMENT_LABEL[key],
        colour: SENTIMENT_COLOUR[key],
        items: visible.filter((c) => c.sentiment === key),
      })).filter((g) => g.items.length > 0);
    }
    return CATEGORY_ORDER.map((code: CategoryCode) => ({
      key: code as string,
      label: CATEGORY_LABEL[code],
      colour: 'var(--csq-line-2)',
      items: visible.filter((c) => c.category === code),
    })).filter((g) => g.items.length > 0);
  }, [visible, groupBy]);

  const respondents = useMemo(
    () => new Set(visible.map((c) => c.respondent.reference)).size,
    [visible],
  );

  if (comments.length === 0) {
    return (
      <StateCard
        title="No free text in this selection"
        body="Assessors are not obliged to write anything, and a cycle can close with ratings and no comments. Widen the filters above, or look at the ratings themselves."
      />
    );
  }

  return (
    <div className="csqh-reader">
      <div className="csqh-card">
        <div className="csqh-readerbar">
          <div className="csqh-field csqh-grow">
            <label className="csqh-label" htmlFor={searchId}>
              Search the comments
            </label>
            <input
              id={searchId}
              className="csqh-input"
              type="search"
              placeholder="parking, demurrage, screening"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="csqh-field">
            <label className="csqh-label" htmlFor={groupId}>
              Group by
            </label>
            <select
              id={groupId}
              className="csqh-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="CATEGORY">Head</option>
              <option value="SENTIMENT">Tone</option>
            </select>
          </div>
        </div>

        <div className="csqh-filters-foot">
          <div className="csqh-chiprow">
            <button
              type="button"
              className="csqh-chip"
              aria-pressed={sentiment === 'ALL'}
              onClick={() => setSentiment('ALL')}
            >
              All {comments.length}
            </button>
            {SENTIMENT_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                className="csqh-chip"
                aria-pressed={sentiment === s}
                onClick={() => setSentiment(s)}
                disabled={counts[s] === 0}
              >
                <i style={{ background: SENTIMENT_COLOUR[s] }} aria-hidden="true" />
                {SENTIMENT_LABEL[s]} {counts[s]}
              </button>
            ))}
          </div>
          {canExport ? (
            <button
              type="button"
              className="csqh-btn csqh-btn--sm"
              onClick={() => onExport(visible)}
              disabled={visible.length === 0}
            >
              Export these comments (CSV)
            </button>
          ) : null}
        </div>
      </div>

      <p className="csqh-tiny" aria-live="polite" style={{ margin: '0 0 18px' }}>
        {visible.length} comments from {respondents} respondents. Tone follows the rating the
        comment was left against, not the words.
      </p>

      {groups.length === 0 ? (
        <StateCard
          title="Nothing matches that"
          body="No comment in this cycle matches the search and tone you have chosen."
          action={
            <button
              type="button"
              className="csqh-btn"
              onClick={() => {
                setQuery('');
                setSentiment('ALL');
              }}
            >
              Reset the comment filters
            </button>
          }
        />
      ) : (
        groups.map((group) => (
          <section className="csqh-group" key={group.key}>
            <div className="csqh-group-hd" style={{ borderBottomColor: group.colour }}>
              <h3>{group.label}</h3>
              <span className="csqh-tiny">{group.items.length} comments</span>
            </div>
            {group.items.map((c) => (
              <Quote key={c.id} comment={c} onOpen={onOpenSubmission} />
            ))}
          </section>
        ))
      )}
    </div>
  );
};

export default CommentsReader;
