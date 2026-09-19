import type { FC } from 'react';
import type { DateWindow } from '../api/approvals.types';
import { formatDate } from '../lib/risk';

interface Props {
  sampling: DateWindow;
  assessment: DateWindow;
}

interface Span {
  left: number;
  width: number;
}

function span(win: DateWindow, min: number, total: number): Span {
  const from = new Date(win.opensAt).getTime();
  const to = new Date(win.closesAt).getTime();
  return { left: ((from - min) / total) * 100, width: ((to - from) / total) * 100 };
}

/**
 * The overlap is a rule of the product, not a diagram flourish: a customer added
 * after assessment opens is still legitimately sampled, which is the whole
 * reason the added-late signal is a prompt rather than a fault.
 */
export const WindowTimeline: FC<Props> = ({ sampling, assessment }) => {
  const starts = [new Date(sampling.opensAt).getTime(), new Date(assessment.opensAt).getTime()];
  const ends = [new Date(sampling.closesAt).getTime(), new Date(assessment.closesAt).getTime()];
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const total = Math.max(max - min, 1);
  const now = Date.now();
  const nowPct = Math.min(100, Math.max(0, ((now - min) / total) * 100));

  const overlapFrom = Math.max(starts[0], starts[1]);
  const overlapTo = Math.min(ends[0], ends[1]);
  const overlaps = overlapTo > overlapFrom;

  const rows: Array<{ label: string; win: DateWindow; colour: string }> = [
    { label: 'Sampling', win: sampling, colour: 'var(--csq-accent)' },
    { label: 'Assessment', win: assessment, colour: 'var(--csq-r4)' },
  ];

  return (
    <div className="csq-ap-tl">
      {rows.map((row) => {
        const s = span(row.win, min, total);
        return (
          <div className="csq-ap-tl-row" key={row.label}>
            <span className="csq-ap-tl-k">{row.label}</span>
            <span className="csq-ap-tl-track">
              <span
                className="csq-ap-tl-bar"
                style={{ left: `${s.left}%`, width: `${s.width}%`, background: row.colour }}
              />
              <span className="csq-ap-tl-now" style={{ left: `${nowPct}%` }} aria-hidden="true" />
            </span>
          </div>
        );
      })}

      <div className="csq-ap-tl-scale">
        <span>{formatDate(new Date(min).toISOString())}</span>
        <span>{formatDate(new Date(max).toISOString())}</span>
      </div>

      <p className="csq-ap-hint" style={{ marginTop: 10 }}>
        {overlaps ? (
          <>
            The windows overlap from {formatDate(new Date(overlapFrom).toISOString())} to{' '}
            {formatDate(new Date(overlapTo).toISOString())}. Customers added in that span are sampled
            legitimately even though assessment has already started, so a late addition is worth a
            second look rather than an automatic removal.
          </>
        ) : (
          <>Sampling closed before assessment opened, so nothing in this batch was added late.</>
        )}
      </p>
    </div>
  );
};
