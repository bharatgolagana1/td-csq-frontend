import { useState, type FC } from 'react';
import type { Airport, ApprovalMode, FormScope, Operator } from '../api/adminMaster.types';
import { formatDate } from '../adminMaster.logic';
import { SelectField, TextAreaField } from './Fields';
import { APPROVAL_MODE_LABEL, FORM_SCOPE_LABEL } from './StateTag';

const SCOPE_OPTIONS: Array<{ value: FormScope; label: string }> = [
  { value: 'INTERNATIONAL', label: `${FORM_SCOPE_LABEL.INTERNATIONAL} (export and import)` },
  { value: 'DOMESTIC', label: `${FORM_SCOPE_LABEL.DOMESTIC} (inbound and outbound)` },
  { value: 'BOTH', label: `${FORM_SCOPE_LABEL.BOTH} (all four directions)` },
];

const MODE_OPTIONS: Array<{ value: ApprovalMode; label: string }> = [
  { value: 'ACFI_REVIEW', label: `${APPROVAL_MODE_LABEL.ACFI_REVIEW}: ACFI clears each customer` },
  { value: 'AUTO', label: `${APPROVAL_MODE_LABEL.AUTO}: customers go live when added` },
];

export interface ApprovalQueueProps {
  pending: Operator[];
  airports: Airport[];
  busyId: string | null;
  onApprove: (id: string, patch: { formScope: FormScope; approvalMode: ApprovalMode }) => void;
  onDecline: (id: string, reason: string) => void;
}

const MIN_REASON = 10;

export const ApprovalQueue: FC<ApprovalQueueProps> = ({
  pending, airports, busyId, onApprove, onDecline,
}) => {
  const [scope, setScope] = useState<Record<string, FormScope | ''>>({});
  const [mode, setMode] = useState<Record<string, ApprovalMode>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [declining, setDeclining] = useState<string | null>(null);

  return (
    <section className="am-card am-queue" id="am-queue" aria-labelledby="am-queue-h">
      <div className="am-card-head">
        <div>
          <h2 id="am-queue-h">Approval queue</h2>
          <p className="sub">
            Terminals that registered themselves. Nothing they submit reaches a cycle until ACFI admits them.
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="am-empty">
          <b>Nothing waiting</b>
          Self registered terminals land here for review.
        </div>
      ) : (
        pending.map((op) => {
          const airport = airports.find((a) => a.id === op.airportId);
          const chosenScope = scope[op.id] ?? op.formScope ?? '';
          const chosenMode = mode[op.id] ?? op.approvalMode;
          const why = reason[op.id] ?? '';
          const busy = busyId === op.id;

          return (
            <article className="am-pend" key={op.id}>
              <div className="am-pend-top">
                <div>
                  <div className="am-op-name">{op.name}</div>
                  <div className="am-op-sub">
                    {airport ? `${airport.city} · ${airport.name}` : 'Airport not matched'}
                    {airport ? <span className="am-code" style={{ marginLeft: 8 }}>{airport.iata}</span> : null}
                  </div>
                  <div className="am-op-sub">
                    Registered {formatDate(op.registeredOn)} by {op.contact.name} · {op.contact.email} · {op.contact.phone}
                  </div>
                </div>
              </div>

              <div className="am-pend-grid">
                <SelectField<FormScope>
                  label="Form scope"
                  value={chosenScope}
                  placeholder="Choose a scope"
                  options={SCOPE_OPTIONS}
                  onChange={(v) => setScope((s) => ({ ...s, [op.id]: v }))}
                  hint="Decides whether the terminal rates export and import, or inbound and outbound."
                />
                <SelectField<ApprovalMode>
                  label="Customer approval"
                  value={chosenMode}
                  options={MODE_OPTIONS}
                  onChange={(v) => setMode((s) => ({ ...s, [op.id]: v }))}
                  hint="How customers this terminal nominates enter the sample."
                />
              </div>

              {declining === op.id && (
                <div style={{ marginTop: 14 }}>
                  <TextAreaField
                    label="Reason for declining"
                    value={why}
                    onChange={(v) => setReason((s) => ({ ...s, [op.id]: v }))}
                    placeholder="Recorded against the registration and sent to the contact above."
                    hint={`At least ${MIN_REASON} characters. Declining keeps the record and its reason, it does not delete the registration.`}
                  />
                </div>
              )}

              <div className="am-pend-actions">
                <button
                  type="button"
                  className="am-btn am-btn--primary"
                  disabled={chosenScope === '' || busy}
                  onClick={() => {
                    if (chosenScope === '') return;
                    onApprove(op.id, { formScope: chosenScope, approvalMode: chosenMode });
                  }}
                >
                  Approve and activate
                </button>

                {declining === op.id ? (
                  <>
                    <button
                      type="button"
                      className="am-btn am-btn--danger"
                      disabled={why.trim().length < MIN_REASON || busy}
                      onClick={() => onDecline(op.id, why.trim())}
                    >
                      Confirm decline
                    </button>
                    <button type="button" className="am-btn am-btn--quiet" onClick={() => setDeclining(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" className="am-btn am-btn--danger" disabled={busy} onClick={() => setDeclining(op.id)}>
                    Decline
                  </button>
                )}

                {chosenScope === '' && (
                  <span className="am-blocked">Set the form scope to approve</span>
                )}
              </div>
            </article>
          );
        })
      )}
    </section>
  );
};
