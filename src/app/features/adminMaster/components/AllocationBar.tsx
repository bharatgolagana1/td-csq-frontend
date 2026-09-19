import type { FC } from 'react';
import { BP_TOTAL, bpToPct, formatBp } from '../adminMaster.logic';

export const SHARE_COLORS = [
  'var(--csq-accent)',
  'var(--csq-r4)',
  'var(--csq-r3)',
  'var(--csq-r2)',
  'var(--csq-r5)',
  'var(--csq-r1)',
];

export interface AllocationSegment {
  id: string;
  label: string;
  bp: number;
}

export interface AllocationBarProps {
  segments: AllocationSegment[];
  /** what the bar is dividing up, used in the remainder sentence */
  noun: string;
  /** offered the shortfall or the excess in one tap, so the constraint is an affordance */
  onSettle?: (segmentId: string, deltaBp: number) => void;
  settleTargetId?: string | null;
}

/**
 * A pool that has to come to 10,000 bp. The shortfall is shown as something to
 * hand to a row rather than as an error, because an admin allocating shares is
 * mid task, not mistaken.
 */
export const AllocationBar: FC<AllocationBarProps> = ({ segments, noun, onSettle, settleTargetId }) => {
  const allocated = segments.reduce((a, s) => a + s.bp, 0);
  const remainder = BP_TOTAL - allocated;
  const target = settleTargetId
    ? segments.find((s) => s.id === settleTargetId)
    : segments[segments.length - 1];

  const scale = Math.max(allocated, BP_TOTAL);

  return (
    <div className="am-alloc">
      <div
        className="am-alloc-bar"
        role="img"
        aria-label={`${noun}: ${bpToPct(allocated)} percent of 100 allocated`}
      >
        {segments.map((s, i) => (
          <span
            key={s.id}
            className="am-alloc-seg"
            style={{
              flex: `0 0 ${(s.bp / scale) * 100}%`,
              background: SHARE_COLORS[i % SHARE_COLORS.length],
            }}
          />
        ))}
      </div>

      <div className="am-alloc-legend">
        {segments.map((s, i) => (
          <span key={s.id}>
            <i style={{ background: SHARE_COLORS[i % SHARE_COLORS.length] }} />
            {s.label} <b>{bpToPct(s.bp)}%</b>
          </span>
        ))}
      </div>

      <div
        className={
          remainder === 0
            ? 'am-remainder am-remainder--ok'
            : remainder < 0
              ? 'am-remainder am-remainder--over'
              : 'am-remainder'
        }
        aria-live="polite"
      >
        {remainder === 0 && <span>Allocated in full. {formatBp(BP_TOTAL)} bp across {segments.length} {segments.length === 1 ? 'row' : 'rows'}.</span>}

        {remainder > 0 && (
          <>
            <span>
              <b>{bpToPct(remainder)}%</b> of the {noun} is unallocated ({formatBp(remainder)} bp).
            </span>
            {onSettle && target && (
              <button type="button" className="am-btn am-btn--sm" onClick={() => onSettle(target.id, remainder)}>
                Add it to {target.label}
              </button>
            )}
          </>
        )}

        {remainder < 0 && (
          <>
            <span>
              Over by <b>{bpToPct(-remainder)}%</b> ({formatBp(-remainder)} bp).
            </span>
            {onSettle && target && (
              <button type="button" className="am-btn am-btn--sm" onClick={() => onSettle(target.id, remainder)}>
                Take it off {target.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
