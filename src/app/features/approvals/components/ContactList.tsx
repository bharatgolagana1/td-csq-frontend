import { useId, useMemo, useState, type FC } from 'react';
import type { ContactChange, SampledContact } from '../api/approvals.types';
import { explainFlag, FLAG_META, FLAG_ORDER, highestSeverity, sortFlags } from '../lib/integrity';
import { COMPANY_TYPE_LABEL, REJECT_LABEL } from '../lib/labels';
import { REASON_LABEL } from '../lib/changes';
import { formatDate } from '../lib/risk';

interface Props {
  contacts: SampledContact[];
  removed: ContactChange[];
  editedIds: Set<string>;
  readOnly: boolean;
  onAdd: () => void;
  onEdit: (contact: SampledContact) => void;
  onRemove: (contact: SampledContact) => void;
  onUndo: (changeId: string) => void;
}

const FlagLegend: FC = () => (
  <details className="csq-ap-legendwrap">
    <summary>What the integrity signals mean</summary>
    <div className="csq-ap-legend">
      {FLAG_ORDER.map((code) => (
        <div className="csq-ap-legend-row" key={code}>
          <span className="csq-ap-flag csq-ap-flag--static" style={{ color: FLAG_META[code].colour }}>
            {FLAG_META[code].label}
          </span>
          <span>{FLAG_META[code].explain}</span>
        </div>
      ))}
      <p className="csq-ap-hint" style={{ margin: '4px 0 0' }}>
        A signal is a prompt to look, not a verdict. Removing a contact needs a reason either way, and
        the operator sees every reason you record.
      </p>
    </div>
  </details>
);

export const ContactList: FC<Props> = ({
  contacts,
  removed,
  editedIds,
  readOnly,
  onAdd,
  onEdit,
  onRemove,
  onUndo,
}) => {
  const searchId = useId();
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  // explicit toggles only: rows with a high severity signal open by default
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const byId = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (flaggedOnly && c.flags.length === 0) return false;
      if (!needle) return true;
      return `${c.name} ${c.company} ${c.email} ${c.phone} ${c.designation}`
        .toLowerCase()
        .includes(needle);
    });
  }, [contacts, search, flaggedOnly]);

  const isOpen = (c: SampledContact) =>
    overrides[c.id] ?? (highestSeverity(c.flags) === 'HIGH');

  return (
    <div>
      <div className="csq-ap-toolbar" style={{ marginBottom: 14 }}>
        <div className="csq-ap-field csq-ap-grow">
          <label className="csq-ap-label" htmlFor={searchId}>
            Find a contact
          </label>
          <input
            id={searchId}
            className="csq-ap-input"
            type="search"
            value={search}
            placeholder="Name, company, email or phone"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="csq-ap-check">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
          />
          Flagged only
        </label>
        {!readOnly ? (
          <button type="button" className="csq-ap-btn" onClick={onAdd}>
            Add a contact
          </button>
        ) : null}
      </div>

      <FlagLegend />

      <p className="csq-ap-meta" style={{ margin: '14px 0 4px' }} aria-live="polite">
        {visible.length} of {contacts.length} contacts shown
      </p>

      {visible.length === 0 ? (
        <div className="csq-ap-empty">
          <b>No contact matches</b>
          Clear the search or the flagged filter to see the rest of the sample.
        </div>
      ) : null}

      {visible.map((c) => {
        const flags = sortFlags(c.flags);
        const open = isOpen(c);
        const panelId = `why-${c.id}`;
        return (
          <div
            className={`csq-ap-contact${c.origin === 'REVIEWER' ? ' is-added' : ''}`}
            key={c.id}
          >
            <div className="csq-ap-crow">
              <div>
                <div className="csq-ap-cname">{c.name}</div>
                <div className="csq-ap-cline">
                  {c.designation}
                  {c.origin === 'REVIEWER' ? (
                    <span style={{ color: 'var(--csq-r5)', fontWeight: 700 }}> · Added in review</span>
                  ) : null}
                  {editedIds.has(c.id) ? (
                    <span style={{ color: 'var(--csq-accent)', fontWeight: 700 }}> · Corrected</span>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="csq-ap-cline">
                  <b>{c.company}</b> · {COMPANY_TYPE_LABEL[c.companyType]}
                </div>
                <div className="csq-ap-cline">
                  {c.email} · {c.phone}
                </div>
                {flags.length > 0 ? (
                  <div className="csq-ap-cflags">
                    {flags.map((code) => (
                      <button
                        type="button"
                        key={code}
                        className="csq-ap-flag"
                        style={{ color: FLAG_META[code].colour }}
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOverrides((o) => ({ ...o, [c.id]: !open }))}
                      >
                        {FLAG_META[code].label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="csq-ap-cline csq-ap-num">
                Added {formatDate(c.addedAt)}
                <div style={{ marginTop: 3 }}>by {c.addedBy}</div>
              </div>

              <div className="csq-ap-cact">
                {readOnly ? null : (
                  <>
                    <button
                      type="button"
                      className="csq-ap-btn csq-ap-btn--sm"
                      onClick={() => onEdit(c)}
                      aria-label={`Correct the details for ${c.name}`}
                    >
                      Correct
                    </button>
                    <button
                      type="button"
                      className="csq-ap-btn csq-ap-btn--sm csq-ap-btn--danger"
                      onClick={() => onRemove(c)}
                      aria-label={`Remove ${c.name} from the sample`}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {flags.length > 0 && open ? (
              <div className="csq-ap-why" id={panelId}>
                {flags.map((code) => (
                  <div className="csq-ap-why-row" key={code}>
                    <span className="csq-ap-why-dot" style={{ background: FLAG_META[code].colour }} />
                    <span>
                      <b>{FLAG_META[code].label}.</b> {explainFlag(code, c, byId)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      {removed.length > 0 ? (
        <div style={{ marginTop: 22 }}>
          <div className="csq-ap-diffhead">
            Removed from this batch ({removed.length})
          </div>
          {removed.map((change) => (
            <div className="csq-ap-contact is-removed" key={change.id}>
              <div className="csq-ap-crow">
                <div>
                  <div className="csq-ap-cname csq-ap-strike">{change.contact.name}</div>
                  <div className="csq-ap-cline">{change.contact.designation}</div>
                </div>
                <div>
                  <div className="csq-ap-cline csq-ap-strike">
                    {change.contact.company} · {change.contact.email}
                  </div>
                  <div className="csq-ap-reason">
                    <span className="tag">{REASON_LABEL[change.reason]}.</span>{' '}
                    {change.note || 'No further note recorded.'}
                  </div>
                </div>
                <div className="csq-ap-cline csq-ap-num">Removed by {change.by}</div>
                <div className="csq-ap-cact">
                  {readOnly ? null : (
                    <button
                      type="button"
                      className="csq-ap-btn csq-ap-btn--sm"
                      onClick={() => onUndo(change.id)}
                      aria-label={`Put ${change.contact.name} back in the sample`}
                    >
                      Put back
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <p className="csq-ap-hint" style={{ marginTop: 10 }}>
            Removals stay visible here until the decision is recorded, and the operator is told which
            contacts went and why. A sample that falls below the minimum cannot be approved: it has to
            be topped up or rejected as {REJECT_LABEL.BELOW_MINIMUM.toLowerCase()}.
          </p>
        </div>
      ) : null}
    </div>
  );
};
