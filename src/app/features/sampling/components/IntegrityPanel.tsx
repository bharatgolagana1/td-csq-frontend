import type { FC } from 'react';
import type { IntegrityFinding } from '../api/sampling.logic';
import { plural } from '../api/sampling.logic';

interface Props {
  findings: IntegrityFinding[];
  locked: boolean;
  restrictedIds: string[] | null;
  onShow: (ids: string[]) => void;
  onShowAll: () => void;
}

function sameSet(a: string[], b: string[] | null): boolean {
  if (!b || a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((id) => set.has(id));
}

export const IntegrityPanel: FC<Props> = ({ findings, locked, restrictedIds, onShow, onShowAll }) => (
  <section className="smp-card" aria-labelledby="smp-signals-h">
    <header>
      <h2 id="smp-signals-h">{locked ? 'Noted on this sample' : 'Worth a look before you lock'}</h2>
      <p className="sub">
        {locked
          ? 'These notes were recorded with the lock. None of them blocks a sample and none of them is an accusation.'
          : 'None of these block a lock and none of them are accusations. They are the patterns a reviewer would ask about later, surfaced now while they are still easy to explain or fix.'}
      </p>
    </header>

    {findings.length === 0 ? (
      <p className="smp-clean">
        Nothing stands out. No contact shares your mail domain, no two contacts share a phone number, and the
        directory was not assembled in a rush.
      </p>
    ) : (
      findings.map((finding) => {
        const showing = sameSet(finding.customerIds, restrictedIds);
        return (
          <div className="smp-signal" key={finding.code}>
            <h3>{finding.headline}</h3>
            <p>{finding.detail}</p>
            {showing ? (
              <button type="button" className="smp-btn smp-btn--ghost" onClick={onShowAll}>
                Show the whole directory
              </button>
            ) : (
              <button type="button" className="smp-btn smp-btn--ghost" onClick={() => onShow(finding.customerIds)}>
                Show {finding.customerIds.length} {plural(finding.customerIds.length, 'contact', 'contacts')}
              </button>
            )}
          </div>
        );
      })
    )}
  </section>
);

export default IntegrityPanel;
