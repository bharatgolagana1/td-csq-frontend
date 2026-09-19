import { useCallback, useEffect, useMemo, useRef, useState, type FC, type KeyboardEvent } from 'react';
import Orbis from '../../../shared/orbis/Orbis';
import { fetchBatchDetail, setApprovalMode, submitDecision } from '../api/approvals.mock';
import type {
  ApprovalMode,
  AuditEntry,
  BatchDetailData,
  ChangeReason,
  ContactChange,
  QueueRow,
  RejectCode,
  SampledContact,
  Viewer,
} from '../api/approvals.types';
import {
  applyChanges,
  changeToAuditAction,
  diffFields,
  nextLocalId,
  summariseChanges,
} from '../lib/changes';
import { countFlagged, highestSeverity, tallyFlags } from '../lib/integrity';
import { APPROVAL_MODE_LABEL, SCOPE_DIRECTIONS, SCOPE_LABEL } from '../lib/labels';
import { assessRisk, formatDate, formatSla, totalFlags } from '../lib/risk';
import { ApprovalModeCard } from './ApprovalModeCard';
import { AuditTrail } from './AuditTrail';
import { ChangeDiff } from './ChangeDiff';
import { ContactDialog, type DraftContact } from './ContactDialog';
import { ContactList } from './ContactList';
import { DecisionDialog } from './DecisionDialog';
import { FlagTallyChips, RiskPill, StatusPill } from './Pills';
import { RemoveDialog } from './RemoveDialog';
import { WindowTimeline } from './WindowTimeline';

interface Props {
  batchId: string;
  viewer: Viewer;
  onBack: () => void;
  onRowChanged: (row: QueueRow) => void;
}

type TabId = 'CONTACTS' | 'CHANGES' | 'AUDIT';

type Dialog =
  | { kind: 'ADD' }
  | { kind: 'EDIT'; contact: SampledContact }
  | { kind: 'REMOVE'; contact: SampledContact }
  | { kind: 'APPROVE' }
  | { kind: 'REJECT' }
  | null;

export const BatchDetail: FC<Props> = ({ batchId, viewer, onBack, onRowChanged }) => {
  const [data, setData] = useState<BatchDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<ContactChange[]>([]);
  const [tab, setTab] = useState<TabId>('CONTACTS');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [modeSaving, setModeSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    CONTACTS: null,
    CHANGES: null,
    AUDIT: null,
  });

  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    setPending([]);
    setNotice(null);
    fetchBatchDetail(batchId)
      .then((d) => {
        if (live) setData(d);
      })
      .catch(() => {
        if (live) setError('That sampling batch could not be loaded.');
      });
    return () => {
      live = false;
    };
  }, [batchId, attempt]);

  const ctx = useMemo(
    () => ({
      operatorDomains: data?.operatorDomains ?? [],
      assessmentOpensAt: data?.assessmentWindow.opensAt ?? new Date().toISOString(),
    }),
    [data],
  );

  const working = useMemo(
    () => (data ? applyChanges(data.contacts, pending, ctx) : []),
    [data, pending, ctx],
  );

  const removedChanges = useMemo(() => pending.filter((c) => c.kind === 'REMOVE'), [pending]);
  const editedIds = useMemo(
    () => new Set(pending.filter((c) => c.kind === 'EDIT').map((c) => c.contactId)),
    [pending],
  );

  const unresolved = useMemo(
    () => working.filter((c) => highestSeverity(c.flags) === 'HIGH'),
    [working],
  );

  const pendingAudit = useMemo<AuditEntry[]>(
    () =>
      pending.map((change) => ({
        id: `pending-${change.id}`,
        at: change.at,
        actor: change.by,
        role: 'SUPER_ADMIN' as const,
        action: changeToAuditAction(change),
        detail: change.note || undefined,
        reason: change.reason,
        pending: true,
      })),
    [pending],
  );

  const upsertChange = useCallback((change: ContactChange) => {
    setPending((list) => {
      const others = list.filter(
        (c) => !(c.contactId === change.contactId && c.kind === change.kind),
      );
      return [...others, change];
    });
  }, []);

  const handleAdd = (draft: DraftContact, reason: ChangeReason, note: string) => {
    const id = nextLocalId('new');
    const contact: SampledContact = {
      id,
      ...draft,
      addedAt: new Date().toISOString(),
      addedBy: viewer.name,
      flags: [],
      origin: 'REVIEWER',
    };
    upsertChange({
      id: nextLocalId('ch'),
      kind: 'ADD',
      contactId: id,
      contact,
      reason,
      note,
      at: new Date().toISOString(),
      by: viewer.name,
    });
    setDialog(null);
    setNotice(`${contact.name} added to the sample.`);
  };

  const handleEdit = (
    target: SampledContact,
    draft: DraftContact,
    reason: ChangeReason,
    note: string,
  ) => {
    setDialog(null);
    if (!data) return;

    // correcting a contact the reviewer added edits that addition rather than
    // recording a correction against something the operator never submitted
    const addChange = pending.find((c) => c.kind === 'ADD' && c.contactId === target.id);
    if (addChange) {
      upsertChange({ ...addChange, contact: { ...addChange.contact, ...draft }, reason, note });
      setNotice(`${draft.name} updated.`);
      return;
    }

    const submitted = data.contacts.find((c) => c.id === target.id);
    if (!submitted) return;
    const updated: SampledContact = { ...submitted, ...draft };
    const fields = diffFields(submitted, updated);

    if (fields.length === 0) {
      setPending((list) => list.filter((c) => !(c.kind === 'EDIT' && c.contactId === target.id)));
      setNotice('Nothing changed, so no correction was recorded.');
      return;
    }

    upsertChange({
      id: nextLocalId('ch'),
      kind: 'EDIT',
      contactId: target.id,
      contact: updated,
      reason,
      note,
      fields,
      at: new Date().toISOString(),
      by: viewer.name,
    });
    setNotice(`Correction recorded for ${updated.name}.`);
  };

  const handleRemove = (contact: SampledContact, reason: ChangeReason, note: string) => {
    setDialog(null);
    if (contact.origin === 'REVIEWER') {
      setPending((list) => list.filter((c) => c.contactId !== contact.id));
      setNotice(`${contact.name} taken back out.`);
      return;
    }
    setPending((list) => [
      ...list.filter((c) => c.contactId !== contact.id),
      {
        id: nextLocalId('ch'),
        kind: 'REMOVE',
        contactId: contact.id,
        contact,
        reason,
        note,
        at: new Date().toISOString(),
        by: viewer.name,
      },
    ]);
    setNotice(`${contact.name} removed from the sample.`);
  };

  const undo = (changeId: string) => {
    setPending((list) => list.filter((c) => c.id !== changeId));
    setNotice('Change undone.');
  };

  const recordDecision = async (
    decision: 'APPROVE' | 'REJECT',
    rejectCode?: RejectCode,
    messageToOperator?: string,
    citedContactIds?: string[],
  ) => {
    if (!data) return;
    setSubmitting(true);
    setDecisionError(null);
    try {
      const result = await submitDecision({
        batchId,
        decision,
        changes: pending,
        finalContactIds: working.map((c) => c.id),
        rejectCode,
        messageToOperator,
        citedContactIds,
      });
      const row: QueueRow = {
        ...data.row,
        status: result.status,
        decidedAt: result.recordedAt,
        decidedBy: result.decidedBy,
        contactCount: decision === 'APPROVE' ? working.length : data.row.contactCount,
        flags: decision === 'APPROVE' ? tallyFlags(working) : data.row.flags,
      };
      setData({
        ...data,
        row,
        contacts: decision === 'APPROVE' ? working : data.contacts,
        recordedChanges: [...data.recordedChanges, ...pending],
        audit: [...data.audit, ...result.audit],
      });
      setPending([]);
      setDialog(null);
      onRowChanged(row);
      setNotice(
        decision === 'APPROVE'
          ? 'Sample approved. The assessors will be invited when the cycle opens.'
          : 'Sample rejected. The operator has been told why.',
      );
    } catch {
      setDecisionError('The decision could not be recorded. Nothing was saved, so try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const changeMode = async (mode: ApprovalMode) => {
    if (!data) return;
    setModeSaving(true);
    try {
      const result = await setApprovalMode(data.row.operatorId, mode);
      const row: QueueRow = { ...data.row, approvalMode: result.mode };
      setData({ ...data, row, audit: [...data.audit, result.audit] });
      onRowChanged(row);
      setNotice(`Approval mode set to ${APPROVAL_MODE_LABEL[result.mode].toLowerCase()}.`);
    } catch {
      setNotice('The approval mode could not be saved.');
    } finally {
      setModeSaving(false);
    }
  };

  if (error) {
    return (
      <div className="csq-ap-card">
        <div className="csq-ap-empty">
          <b>{error}</b>
          It may have been withdrawn by the operator while you were reading the queue.
          <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="csq-ap-btn" onClick={() => setAttempt((a) => a + 1)}>
              Try again
            </button>
            <button type="button" className="csq-ap-btn csq-ap-btn--primary" onClick={onBack}>
              Back to the queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="csq-ap-center">
        <Orbis label="Loading the batch" />
      </div>
    );
  }

  const { row } = data;
  const readOnly = row.status !== 'AWAITING_REVIEW';
  const risk = assessRisk(row);
  const sla = formatSla(row.slaDueAt);
  const summary = summariseChanges(pending);
  const signalCount = totalFlags(tallyFlags(working));
  const shortfall = row.minimumContacts - working.length;
  const canApprove = shortfall <= 0 && !submitting;

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: 'CONTACTS', label: 'Contacts', count: working.length },
    { id: 'CHANGES', label: 'Changes', count: pending.length + data.recordedChanges.length },
    { id: 'AUDIT', label: 'Audit trail', count: data.audit.length + pendingAudit.length },
  ];

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const order = tabs.map((t) => t.id);
    const index = order.indexOf(tab);
    let next: TabId | null = null;
    if (e.key === 'ArrowRight') next = order[(index + 1) % order.length];
    else if (e.key === 'ArrowLeft') next = order[(index - 1 + order.length) % order.length];
    else if (e.key === 'Home') next = order[0];
    else if (e.key === 'End') next = order[order.length - 1];
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      <div className="csq-ap-crumb">
        <button type="button" className="csq-ap-back" onClick={onBack}>
          <span aria-hidden="true">&lt;</span> All batches
        </button>
        <StatusPill status={row.status} />
        <RiskPill band={risk.band} reasons={risk.reasons} />
      </div>

      <div className="csq-ap-head">
        <div>
          <div className="csq-ap-eyebrow">
            {row.cycleLabel} · {SCOPE_LABEL[row.scope]} terminal · {SCOPE_DIRECTIONS[row.scope]}
          </div>
          <div className="csq-ap-title">
            <h1>{row.operatorName}</h1>
          </div>
          <p className="csq-ap-sub">
            {row.terminalName} · {row.airportName} <span className="csq-ap-iata">{row.airportIata}</span>{' '}
            · Submitted {formatDate(row.submittedAt)} by {row.submittedBy}
          </p>
        </div>
        <div className="csq-ap-headside">
          <span className="csq-ap-sample">Illustrative · sample data</span>
        </div>
      </div>

      {notice ? (
        <div className="csq-ap-banner csq-ap-banner--good" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}

      {row.status === 'AUTO_APPROVED' ? (
        <div className="csq-ap-banner csq-ap-banner--warn">
          <b>This batch was approved automatically</b>
          {row.operatorName} is set to automatic approval, so this sample went into the cycle without
          anyone at ACFI seeing it. {countFlagged(working)} of {working.length} contacts carry a
          signal. Changing the mode below applies to the next batch, not this one.
        </div>
      ) : null}

      {row.status === 'REJECTED' || row.status === 'APPROVED' ? (
        <div
          className={
            row.status === 'APPROVED' ? 'csq-ap-banner csq-ap-banner--good' : 'csq-ap-banner csq-ap-banner--bad'
          }
        >
          <b>
            {row.status === 'APPROVED' ? 'Approved' : 'Rejected'}
            {row.decidedAt ? ` on ${formatDate(row.decidedAt)}` : ''}
            {row.decidedBy ? ` by ${row.decidedBy}` : ''}
          </b>
          The sample is locked. The audit trail below holds the reasons the operator was given.
        </div>
      ) : null}

      <div className="csq-ap-stats">
        <div className="csq-ap-stat">
          <div className="k">Contacts</div>
          <div className="v" style={{ color: shortfall > 0 ? 'var(--csq-r1)' : 'var(--csq-ink)' }}>
            {working.length}
            <span style={{ fontSize: 14, color: 'var(--csq-muted)', fontWeight: 700 }}>
              {' '}
              / {row.minimumContacts}
            </span>
          </div>
          <div className="n">
            {shortfall > 0 ? `${shortfall} short of the cycle minimum` : 'Meets the cycle minimum'}
          </div>
        </div>

        <div className="csq-ap-stat">
          <div className="k">Flagged</div>
          <div className="v">{countFlagged(working)}</div>
          <div className="n">
            {signalCount} {signalCount === 1 ? 'signal' : 'signals'} across the sample
          </div>
        </div>

        <div className="csq-ap-stat">
          <div className="k">Review deadline</div>
          <div className="v" style={{ fontSize: 17, color: sla.colour }}>
            {readOnly ? 'Closed' : sla.text}
          </div>
          <div className="n">{formatDate(row.slaDueAt)}</div>
        </div>

        <div className="csq-ap-stat">
          <div className="k">Your changes</div>
          <div className="v">{summary.total}</div>
          <div className="n">
            {summary.removed} removed · {summary.added} added · {summary.edited} corrected
          </div>
        </div>
      </div>

      <div className="csq-ap-card">
        <div className="csq-ap-sectionhead">
          <div>
            <h2>Signals in this batch</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              {readOnly
                ? 'Counted over the sample as it was approved.'
                : 'Counted over the sample as it stands, including your unsaved changes.'}
            </p>
          </div>
          <FlagTallyChips tally={tallyFlags(working)} />
        </div>
        <WindowTimeline sampling={data.samplingWindow} assessment={data.assessmentWindow} />
      </div>

      <div className="csq-ap-card">
        <div className="csq-ap-tabs" role="tablist" aria-label="Batch sections" onKeyDown={onTabKey}>
          {tabs.map((t) => (
            <button
              type="button"
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              className="csq-ap-tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              onClick={() => setTab(t.id)}
            >
              {t.label} <span className="cnt">{t.count}</span>
            </button>
          ))}
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
          {tab === 'CONTACTS' ? (
            <ContactList
              contacts={working}
              removed={removedChanges}
              editedIds={editedIds}
              readOnly={readOnly}
              onAdd={() => setDialog({ kind: 'ADD' })}
              onEdit={(contact) => setDialog({ kind: 'EDIT', contact })}
              onRemove={(contact) => setDialog({ kind: 'REMOVE', contact })}
              onUndo={undo}
            />
          ) : null}

          {tab === 'CHANGES' ? (
            <ChangeDiff
              submittedCount={data.submittedCount}
              finalCount={working.length}
              pending={pending}
              recorded={data.recordedChanges}
              onUndo={undo}
            />
          ) : null}

          {tab === 'AUDIT' ? <AuditTrail entries={[...data.audit, ...pendingAudit]} /> : null}
        </div>
      </div>

      <ApprovalModeCard
        operatorName={row.operatorName}
        mode={row.approvalMode}
        saving={modeSaving}
        onChange={changeMode}
      />

      {!readOnly ? (
        <div className="csq-ap-bar">
          <div className="csq-ap-barinfo">
            <b>{working.length}</b> contacts in the final sample
            {summary.total > 0 ? (
              <span style={{ color: 'var(--csq-muted)' }}> · {summary.total} unsaved changes</span>
            ) : null}
            <div className="csq-ap-hint" id="csq-ap-approve-help">
              {shortfall > 0
                ? `Add ${shortfall} more contact${shortfall === 1 ? '' : 's'} or reject the batch: a sample below the minimum cannot be approved.`
                : 'Approving locks this list as the customer assessors for the cycle.'}
            </div>
          </div>
          <div className="csq-ap-baract">
            <button
              type="button"
              className="csq-ap-btn csq-ap-btn--danger"
              onClick={() => setDialog({ kind: 'REJECT' })}
              disabled={submitting}
            >
              Reject
            </button>
            <button
              type="button"
              className="csq-ap-btn csq-ap-btn--primary"
              onClick={() => setDialog({ kind: 'APPROVE' })}
              disabled={!canApprove}
              aria-describedby="csq-ap-approve-help"
            >
              Approve sample
            </button>
          </div>
        </div>
      ) : null}

      {dialog?.kind === 'ADD' ? (
        <ContactDialog
          mode="ADD"
          operatorDomains={data.operatorDomains}
          onCancel={() => setDialog(null)}
          onSave={handleAdd}
        />
      ) : null}

      {dialog?.kind === 'EDIT' ? (
        <ContactDialog
          mode="EDIT"
          contact={dialog.contact}
          operatorDomains={data.operatorDomains}
          onCancel={() => setDialog(null)}
          onSave={(draft, reason, note) => handleEdit(dialog.contact, draft, reason, note)}
        />
      ) : null}

      {dialog?.kind === 'REMOVE' ? (
        <RemoveDialog
          contact={dialog.contact}
          remainingAfter={working.length - 1}
          minimum={row.minimumContacts}
          onCancel={() => setDialog(null)}
          onConfirm={(reason, note) => handleRemove(dialog.contact, reason, note)}
        />
      ) : null}

      {dialog?.kind === 'APPROVE' || dialog?.kind === 'REJECT' ? (
        <DecisionDialog
          mode={dialog.kind}
          operatorName={row.operatorName}
          submittedCount={data.submittedCount}
          finalCount={working.length}
          minimum={row.minimumContacts}
          changes={summary}
          unresolved={unresolved}
          submitting={submitting}
          error={decisionError}
          onCancel={() => setDialog(null)}
          onApprove={() => void recordDecision('APPROVE')}
          onReject={(code, message, cited) => void recordDecision('REJECT', code, message, cited)}
        />
      ) : null}
    </div>
  );
};
