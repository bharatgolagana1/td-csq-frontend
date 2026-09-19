import type { CommentEntry, CycleSummary, SubmissionDetail, SubmissionRow } from '../api/history.types';
import { buildCsv, downloadCsv } from './csv';
import { ASSESSOR_KIND_LABEL, ASSESSOR_TYPE_LABEL, CATEGORY_LABEL, DIRECTION_LABEL, formatDayTime } from './labels';
import { RATING_LABEL, SENTIMENT_LABEL, bandLabel } from './scoring';

/**
 * Exports carry the respondent reference and never a name, for the same reason
 * the screen does: a file leaves the building far more easily than a screen does.
 */
function filename(kind: string, cycleId: string): string {
  return `csq-confidential-${kind}-${cycleId}.csv`;
}

export function exportSubmissions(rows: SubmissionRow[], cycle: CycleSummary): void {
  const csv = buildCsv(
    [
      'Assessment id',
      'Cycle',
      'Assessor kind',
      'Assessor type',
      'Respondent reference',
      'Status',
      'Submitted',
      'Ratings given',
      'Not applicable',
      'Comments',
      'Score',
      'Band',
      'Counts toward published score',
    ],
    rows.map((r) => [
      r.id,
      r.cycleLabel,
      ASSESSOR_KIND_LABEL[r.assessorKind],
      ASSESSOR_TYPE_LABEL[r.respondent.type],
      r.respondent.reference,
      r.status === 'SUBMITTED' ? 'Submitted' : 'In progress',
      r.submittedAt ? formatDayTime(r.submittedAt) : '',
      r.status === 'SUBMITTED' ? r.answeredCount : '',
      r.status === 'SUBMITTED' ? r.naCount : '',
      r.status === 'SUBMITTED' ? r.commentCount : '',
      r.score === null ? '' : r.score.toFixed(1),
      r.score === null ? '' : bandLabel(r.score),
      r.countsTowardScore ? 'Yes' : 'No',
    ]),
  );
  downloadCsv(filename('submissions', cycle.id), csv);
}

export function exportComments(comments: CommentEntry[], cycle: CycleSummary): void {
  const csv = buildCsv(
    [
      'Assessment id',
      'Cycle',
      'Assessor kind',
      'Assessor type',
      'Respondent reference',
      'Head',
      'Parameter no',
      'Parameter',
      'Direction',
      'Rating',
      'Tone',
      'Comment',
      'Submitted',
    ],
    comments.map((c) => [
      c.submissionId,
      cycle.label,
      ASSESSOR_KIND_LABEL[c.assessorKind],
      ASSESSOR_TYPE_LABEL[c.respondent.type],
      c.respondent.reference,
      CATEGORY_LABEL[c.category],
      c.parameterNo,
      c.question,
      DIRECTION_LABEL[c.direction],
      RATING_LABEL[c.rating],
      SENTIMENT_LABEL[c.sentiment],
      c.text,
      formatDayTime(c.submittedAt),
    ]),
  );
  downloadCsv(filename('comments', cycle.id), csv);
}

export function exportAnswers(detail: SubmissionDetail): void {
  const rows = detail.parameters.flatMap((p) =>
    p.answers.map((a) => [
      detail.id,
      CATEGORY_LABEL[p.category],
      p.parameterNo,
      p.question,
      DIRECTION_LABEL[a.direction],
      RATING_LABEL[a.rating],
      a.rating === 'NA' ? '' : a.rating,
      a.comment ?? '',
    ]),
  );
  const csv = buildCsv(
    ['Assessment id', 'Head', 'Parameter no', 'Parameter', 'Direction', 'Rating', 'Rating value', 'Comment'],
    rows,
  );
  downloadCsv(`csq-confidential-answers-${detail.id}.csv`, csv);
}
