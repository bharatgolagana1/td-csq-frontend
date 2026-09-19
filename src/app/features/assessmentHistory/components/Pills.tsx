import type { FC } from 'react';
import type { AssessorKind, RatingChoice, SubmissionStatus } from '../api/history.types';
import { ASSESSOR_KIND_LABEL } from '../lib/labels';
import { RATING_COLOUR, RATING_LABEL } from '../lib/scoring';

const KIND_CLASS: Record<AssessorKind, string> = {
  SELF: 'csqh-pill csqh-pill--self',
  CUSTOMER: 'csqh-pill csqh-pill--customer',
  EXTERNAL: 'csqh-pill csqh-pill--external',
};

export const KindPill: FC<{ kind: AssessorKind }> = ({ kind }) => (
  <span className={KIND_CLASS[kind]}>{ASSESSOR_KIND_LABEL[kind]}</span>
);

export const StatusPill: FC<{ status: SubmissionStatus }> = ({ status }) =>
  status === 'SUBMITTED' ? null : (
    <span className="csqh-pill" style={{ borderColor: 'var(--csq-r2)', color: 'var(--csq-r2)' }}>
      In progress
    </span>
  );

/** A rating always carries its word. A bare 4 means nothing to someone new to the scale. */
export const RatingTag: FC<{ rating: RatingChoice; showValue?: boolean }> = ({
  rating,
  showValue = true,
}) => (
  <span className="csqh-rating" style={{ color: RATING_COLOUR[rating] }}>
    <i style={{ background: RATING_COLOUR[rating] }} aria-hidden="true" />
    {RATING_LABEL[rating]}
    {showValue && rating !== 'NA' ? (
      <span className="csqh-num" style={{ color: 'var(--csq-muted)' }}>
        {rating}
      </span>
    ) : null}
  </span>
);

/** A separator that reads as punctuation to the eye and as nothing to a screen reader. */
export const Dot: FC = () => (
  <span className="csqh-dot" aria-hidden="true">
    ·
  </span>
);
