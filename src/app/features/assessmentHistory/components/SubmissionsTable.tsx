import type { FC } from 'react';
import type { SubmissionRow } from '../api/history.types';
import type { SortDir, SortKey } from '../lib/filters';
import { ASSESSOR_TYPE_LABEL, formatDay } from '../lib/labels';
import { bandLabel, scoreColour } from '../lib/scoring';
import { KindPill, StatusPill } from './Pills';

interface Props {
  rows: SubmissionRow[];
  answerSlots: number;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onOpen: (id: string) => void;
  openId: string | null;
}

const ariaSort = (active: boolean, dir: SortDir): 'ascending' | 'descending' | 'none' =>
  active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none';

export const SubmissionsTable: FC<Props> = ({
  rows,
  answerSlots,
  sortKey,
  sortDir,
  onSort,
  onOpen,
  openId,
}) => (
  <div className="csqh-tablewrap">
    <table className="csqh-table">
      <caption className="csqh-sronly">
        Assessments submitted against your terminal. Select an assessment id to read every answer.
      </caption>
      <thead>
        <tr>
          <th scope="col">Assessment</th>
          <th scope="col">Cycle</th>
          <th scope="col" aria-sort={ariaSort(sortKey === 'respondent', sortDir)}>
            <button type="button" className="csqh-sortbtn" onClick={() => onSort('respondent')}>
              Assessor{' '}
              <span aria-hidden="true">{sortKey === 'respondent' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
            </button>
          </th>
          <th scope="col" aria-sort={ariaSort(sortKey === 'submittedAt', sortDir)}>
            <button type="button" className="csqh-sortbtn" onClick={() => onSort('submittedAt')}>
              Submitted{' '}
              <span aria-hidden="true">{sortKey === 'submittedAt' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
            </button>
          </th>
          <th scope="col">Answers</th>
          <th scope="col">Comments</th>
          <th scope="col" className="csqh-right" aria-sort={ariaSort(sortKey === 'score', sortDir)}>
            <button type="button" className="csqh-sortbtn" onClick={() => onSort('score')}>
              Score{' '}
              <span aria-hidden="true">{sortKey === 'score' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={row.id === openId ? 'is-open' : undefined}
            onClick={() => onOpen(row.id)}
          >
            <td data-label="Assessment">
              <button
                type="button"
                id={`csqh-row-${row.id}`}
                className="csqh-rowbtn"
                aria-label={`Open assessment ${row.id} from ${row.respondent.reference}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(row.id);
                }}
              >
                {row.id}
              </button>
            </td>
            <td data-label="Cycle" className="csqh-tiny">
              {row.cycleLabel}
            </td>
            <td data-label="Assessor">
              <div className="csqh-cell">
                <KindPill kind={row.assessorKind} />
                <span>{row.respondent.reference}</span>
              </div>
              <div className="csqh-tiny">{ASSESSOR_TYPE_LABEL[row.respondent.type]}</div>
            </td>
            <td data-label="Submitted" className="csqh-num">
              {row.status === 'SUBMITTED' ? formatDay(row.submittedAt) : <StatusPill status={row.status} />}
            </td>
            <td data-label="Answers" className="csqh-num">
              {row.status === 'SUBMITTED' ? (
                <>
                  {row.answeredCount} of {answerSlots}
                  {row.naCount > 0 ? <div className="csqh-tiny">{row.naCount} not applicable</div> : null}
                </>
              ) : (
                <span className="csqh-muted">Not visible yet</span>
              )}
            </td>
            <td data-label="Comments" className="csqh-num">
              {row.status === 'SUBMITTED' ? row.commentCount : <span className="csqh-muted">0</span>}
            </td>
            <td data-label="Score" className="csqh-right">
              {row.score === null ? (
                <span className="csqh-muted">Not scored</span>
              ) : (
                <>
                  <span className="csqh-score" style={{ color: scoreColour(row.score) }}>
                    {row.score.toFixed(1)}
                  </span>
                  <span className="csqh-score-b">{bandLabel(row.score)}</span>
                </>
              )}
              {!row.countsTowardScore && row.score !== null ? (
                <span className="csqh-score-b">not counted</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SubmissionsTable;
