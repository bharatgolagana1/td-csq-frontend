import { useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useInvitations, useResendInvitation, useRevokeInvitation } from '@/api/invitations';
import { canResendInvitation, canRevokeInvitation, type Invitation, type InvitationState } from '@/api/invitations.types';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, type MenuItem, Pagination, Pill, Select, statusVariant, Table, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatDateTime, formatInt } from '@/lib/format';

import styles from './sampling.module.css';
import { INVITATION_STATE_LABELS, INVITATION_STATE_OPTIONS, SURVEY_TYPE_LABELS, surveyTypeVariant } from './samplingLabels';

export type InvitationsTabProps = {
  cycleId: string;
  acoId: string;
  tz: string;
  /** `notifications.send` */
  canResend: boolean;
  /** `sampling.manage` */
  canRevoke: boolean;
};

function when(iso: string | null, tz: string) {
  return iso ? <span>{formatDateTime(iso, tz)}</span> : <span className={styles.muted}>—</span>;
}

/** After lock: every invitation with its state, masked e-mail, timestamps and reminders (§6 invitations). */
export function InvitationsTab({ cycleId, acoId, tz, canResend, canRevoke }: InvitationsTabProps) {
  const toast = useToast();
  const [state, setState] = useState<InvitationState | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [revoking, setRevoking] = useState<Invitation | null>(null);
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();

  const query = useInvitations({ cycleId, acoId: acoId || undefined, state: state || undefined, page, pageSize });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  const doResend = (inv: Invitation) =>
    resend.mutate(inv.id, {
      onSuccess: () => toast.success(`Invitation re-sent to ${inv.emailMasked}`),
      onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
    });
  const doRevoke = () => {
    if (!revoking) return;
    revoke.mutate(revoking.id, {
      onSuccess: () => {
        toast.success(`Invitation for ${revoking.customer.nameMasked} revoked`);
        setRevoking(null);
      },
      onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
    });
  };

  const columns: Column<Invitation>[] = [
    {
      id: 'customer',
      header: 'Customer',
      cell: (inv) => (
        <span className={styles.customer}>
          <span className={styles.customerName}>{inv.customer.nameMasked}</span>
          <span className={styles.customerContact}>{inv.customer.type === 'FF' ? 'Freight forwarder' : 'Customs broker'}</span>
        </span>
      ),
    },
    {
      id: 'surveyType',
      header: 'Survey',
      width: 120,
      hideBelow: 'sm',
      cell: (inv) => (
        <Pill variant={surveyTypeVariant(inv.surveyType)} dot={false} size="sm">
          {SURVEY_TYPE_LABELS[inv.surveyType]}
        </Pill>
      ),
    },
    { id: 'state', header: 'State', width: 110, cell: (inv) => <Pill variant={statusVariant(inv.state)}>{INVITATION_STATE_LABELS[inv.state]}</Pill> },
    { id: 'email', header: 'E-mail', hideBelow: 'md', cell: (inv) => <span className={styles.email}>{inv.emailMasked}</span> },
    { id: 'sentAt', header: 'Sent', width: 160, mono: true, hideBelow: 'md', cell: (inv) => when(inv.sentAt, tz) },
    { id: 'openedAt', header: 'Opened', width: 160, mono: true, hideBelow: 'md', cell: (inv) => when(inv.openedAt, tz) },
    { id: 'submittedAt', header: 'Submitted', width: 160, mono: true, hideBelow: 'md', cell: (inv) => when(inv.submittedAt, tz) },
    {
      id: 'reminders',
      header: 'Reminders',
      width: 110,
      align: 'right',
      mono: true,
      hideBelow: 'sm',
      cell: (inv) => <span title={inv.lastReminderAt ? `Last ${formatDateTime(inv.lastReminderAt, tz)}` : undefined}>{formatInt(inv.remindersSent)}</span>,
    },
  ];

  const rowActions = (inv: Invitation): MenuItem[] => {
    const items: MenuItem[] = [];
    if (canResend && canResendInvitation(inv.state)) items.push({ id: 'resend', label: 'Resend invitation', icon: <Icon name="mail" size={16} />, onSelect: () => doResend(inv) });
    if (canRevoke && canRevokeInvitation(inv.state)) items.push({ id: 'revoke', label: 'Revoke', icon: <Icon name="x" size={16} />, danger: true, onSelect: () => setRevoking(inv) });
    if (items.length === 0) items.push({ id: 'none', label: 'No actions available', disabled: true, onSelect: () => undefined });
    return items;
  };

  if (query.isError) return <QueryError error={query.error} title="Could not load invitations" onRetry={() => void query.refetch()} />;

  return (
    <>
      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'invitation' : 'invitations'}`}</ToolbarCount>}>
        <Select
          aria-label="State"
          size="sm"
          options={INVITATION_STATE_OPTIONS}
          value={state}
          onChange={(e) => {
            setState(e.target.value as InvitationState | '');
            setPage(1);
          }}
        />
        <span className={styles.toolbarNote}>E-mails are masked; the participant’s identity stays confidential.</span>
      </Toolbar>
      <Table
        caption="Invitations"
        columns={columns}
        rows={rows}
        rowKey={(inv) => inv.id}
        loading={query.isPending}
        rowActions={canResend || canRevoke ? rowActions : undefined}
        empty={
          <EmptyState
            icon="mail"
            title={state ? 'No invitations in this state' : 'No invitations yet'}
            description={state ? 'Try another state.' : 'Invitations are created when the sample is locked and sent when the assessment opens.'}
          />
        }
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />
      <ConfirmDialog
        open={revoking !== null}
        onClose={() => (revoke.isPending ? undefined : setRevoking(null))}
        onConfirm={doRevoke}
        loading={revoke.isPending}
        danger
        title="Revoke this invitation?"
        description={revoking ? `${revoking.customer.nameMasked} (${revoking.emailMasked}) will no longer be able to open the assessment. This cannot be undone.` : undefined}
        confirmLabel="Revoke"
      />
    </>
  );
}
