import { useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useNotifications, useResendNotification } from '@/api/notifications';
import { type Notification, NOTIFICATION_STATUSES, NOTIFICATION_TEMPLATES, type NotificationStatus } from '@/api/notifications.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Banner, Button, IconButton, PageHeader, Pagination, SearchInput, Select, Switch, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { ConfirmDialog } from '@/design/primitives/ConfirmDialog/ConfirmDialog';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatInt, humanise } from '@/lib/format';
import { formatClock } from '@/lib/stamp';

import { NotificationDrawer } from './NotificationDrawer';
import styles from './notifications.module.css';
import { NotificationsTable } from './NotificationsTable';
import { useNotificationFilters } from './useNotificationFilters';
import { useRefNames } from './useRefNames';

/** Auto-refresh interval of the log (WAVE1 brief: 30 s). */
export const REFRESH_MS = 30_000;

const TEMPLATE_OPTIONS = [{ value: '', label: 'All templates' }, ...NOTIFICATION_TEMPLATES.map((t) => ({ value: t, label: humanise(t) }))];
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...NOTIFICATION_STATUSES.map((s) => ({ value: s, label: humanise(s) }))];

/** Notifications: the outgoing e-mail log with filters, a detail drawer and resend (§6 notifications). */
export default function NotificationsPage() {
  const { hasTask } = useSession();
  const canSend = hasTask('notifications.send');
  const toast = useToast();
  const list = useNotificationFilters();
  const refs = useRefNames();
  const [auto, setAuto] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastSelected, setLastSelected] = useState<Notification | null>(null);
  const [resendTarget, setResendTarget] = useState<Notification | null>(null);

  const query = useNotifications(list.query, { refetchInterval: auto ? REFRESH_MS : false });
  const resend = useResendNotification();

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  // The drawer follows the row as the list refreshes (QUEUED → SENT), falling back to the last snapshot.
  const selected = selectedId ? (rows.find((n) => n.id === selectedId) ?? lastSelected) : null;
  const logOnly = rows.some((n) => n.channel === 'LOG');

  const open = (n: Notification) => {
    setSelectedId(n.id);
    setLastSelected(n);
  };
  const close = () => setSelectedId(null);

  const confirmResend = () => {
    const target = resendTarget;
    if (!target) return;
    resend.mutate(target.id, {
      onSuccess: (created) => {
        setResendTarget(null);
        if (created.status === 'FAILED') toast.error(`Resend to ${created.to} failed`, { description: created.error ?? undefined });
        else toast.success(`Resent to ${created.to}`);
        if (selectedId) open(created);
      },
      onError: (e) => toast.error(`Could not resend: ${errorMessage(e)}`, { requestId: errorRequestId(e) }),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Notifications"
        context="Every e-mail the platform sent — invitations, reminders, registration and sample updates — with its delivery status."
        actions={
          <div className={styles.refresh}>
            {query.dataUpdatedAt ? (
              <span className={styles.updated} aria-live="polite">
                Updated {formatClock(query.dataUpdatedAt)}
              </span>
            ) : null}
            <Switch size="sm" checked={auto} onChange={setAuto} label="Auto-refresh" />
            <IconButton label="Refresh now" icon={<Icon name="refresh" />} variant="secondary" onClick={() => void query.refetch()} disabled={query.isFetching} />
          </div>
        }
      />

      {logOnly ? (
        <Banner tone="info" title="Logged, not e-mailed" className={styles.banner}>
          No SMTP server is configured, so this page is the outbox: every message is rendered and recorded here instead of being delivered.
        </Banner>
      ) : null}

      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'notification' : 'notifications'}`}</ToolbarCount>}>
        <SearchInput value={list.filters.q} onChange={(v) => list.set('q', v)} debounce={300} placeholder="Search recipient or subject" label="Search notifications" />
        <Select aria-label="Template" size="sm" options={TEMPLATE_OPTIONS} value={list.filters.template} onChange={(e) => list.set('template', e.target.value)} />
        <Select aria-label="Status" size="sm" options={STATUS_OPTIONS} value={list.filters.status} onChange={(e) => list.set('status', e.target.value as NotificationStatus | '')} />
        {refs.cycleOptions.length > 0 ? (
          <Select aria-label="Cycle" size="sm" options={[{ value: '', label: 'All cycles' }, ...refs.cycleOptions]} value={list.filters.cycleId} onChange={(e) => list.set('cycleId', e.target.value)} />
        ) : null}
        {refs.canFilterOperators ? (
          <Select aria-label="Operator" size="sm" options={[{ value: '', label: 'All operators' }, ...refs.operatorOptions]} value={list.filters.acoId} onChange={(e) => list.set('acoId', e.target.value)} />
        ) : null}
        {list.hasFilters ? (
          <Button variant="ghost" size="sm" onClick={list.reset}>
            Clear filters
          </Button>
        ) : null}
      </Toolbar>

      {query.isError ? (
        <QueryError error={query.error} title="Could not load notifications" onRetry={() => void query.refetch()} />
      ) : (
        <>
          <NotificationsTable
            rows={rows}
            loading={query.isPending}
            sort={list.sort}
            onSortChange={list.setSort}
            onOpen={open}
            onResend={canSend ? setResendTarget : undefined}
            names={refs.names}
            emptyTitle={list.hasFilters ? 'No notifications match' : 'No notifications yet'}
            emptyDescription={
              list.hasFilters ? 'Try another search, template, status or cycle.' : 'Messages appear here as the platform sends them — invitations, reminders and registration updates.'
            }
            emptyAction={
              list.hasFilters ? (
                <Button variant="primary" onClick={list.reset}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="primary" onClick={() => void query.refetch()}>
                  Refresh
                </Button>
              )
            }
          />
          <Pagination page={list.page} pageSize={list.pageSize} total={total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} />
        </>
      )}

      <NotificationDrawer notification={selected} open={selectedId !== null} onClose={close} onResend={canSend ? setResendTarget : undefined} names={refs.names} />

      <ConfirmDialog
        open={resendTarget !== null}
        onClose={() => setResendTarget(null)}
        onConfirm={confirmResend}
        title="Resend this e-mail?"
        description={resendTarget ? `A new copy of “${resendTarget.subject}” goes to ${resendTarget.to}. The original entry stays in the log.` : undefined}
        confirmLabel="Resend"
        loading={resend.isPending}
      />
    </>
  );
}
