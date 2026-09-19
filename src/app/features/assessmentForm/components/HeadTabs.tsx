import { useRef, type FC, type KeyboardEvent } from 'react';
import type { Head, HeadCode, Progress } from '../api/assessmentForm.types';

export interface HeadTabsProps {
  heads: Head[];
  active: HeadCode;
  progress: Record<string, Progress>;
  onSelect: (code: HeadCode) => void;
}

/**
 * Four heads, one at a time. Twenty three questions answered twice is a wall on
 * a phone, and a section that can be finished is the difference between a
 * completed assessment and an abandoned one.
 */
export const HeadTabs: FC<HeadTabsProps> = ({ heads, active, progress, onSelect }) => {
  const listRef = useRef<HTMLDivElement | null>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const index = heads.findIndex((h) => h.code === active);
    const next = heads[(index + step + heads.length) % heads.length];
    onSelect(next.code);
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-head="${next.code}"]`);
    el?.focus();
  };

  return (
    <div className="af-tabs" role="tablist" aria-label="Assessment sections" ref={listRef} onKeyDown={onKeyDown}>
      {heads.map((h) => {
        const p = progress[h.code] ?? { answered: 0, total: 0 };
        const complete = p.total > 0 && p.answered === p.total;
        const isActive = h.code === active;
        return (
          <button
            key={h.code}
            type="button"
            role="tab"
            data-head={h.code}
            id={`tab-${h.code}`}
            aria-selected={isActive}
            aria-controls={`panel-${h.code}`}
            tabIndex={isActive ? 0 : -1}
            className={isActive ? 'af-tab is-active' : 'af-tab'}
            onClick={() => onSelect(h.code)}
          >
            <span className="af-tab-label">{h.shortLabel}</span>
            <span className={complete ? 'af-tab-count is-done' : 'af-tab-count'}>
              {p.answered}/{p.total}
            </span>
            <span className="af-tab-bar" aria-hidden="true">
              <span style={{ width: p.total === 0 ? '0%' : `${(p.answered / p.total) * 100}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default HeadTabs;
