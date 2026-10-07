import { useState } from 'react';

import { errorMessage, errorRequestId } from '@/api/client';
import { useNotifications, useResendNotification } from '@/api/notifications';
import { type Notification, type NotificationStatus } from '@/api/notifications.types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, type MenuItem, Pagination, Pill, Select, statusVariant, Table, Toolbar, ToolbarCount, useToast } from '@/design/primitives';
import { QueryError } from '@/design/primitives/QueryError/QueryError';
import { formatDateTime, formatInt, humanise } from '@/lib/format';

import styles from './cycles.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'SENT', label: 'Sent' },
  { value: 'FAILED', label: 'Failed' },
];

/** Notifications sent for this cycle (`GET /notifications?cycleId=`) with resend. */
export function NotificationsTab({ cycleId, tz }: { cycleId: string; tz: string }) {
  const { hasTask } = useSession();
  const toast = useToast();
  const resend = useResendNotification();
  const [status, setStatus] = useState<NotificationStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const query = useNotifications({ cycleId, status: status || undefined, page, pageSize, sort: '-createdAt' });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  const columns: Column<Notification>[] = [
    { id: 'createdAt', header: 'When', width: 160, mono: true, cell: (n) => formatDateTime(n.sentAt ?? n.createdAt, tz) },
    { id: 'template', header: 'Template', width: 190, hideBelow: 'md', cell: (n) => humanise(n.template) },
    {
      id: 'subject',
      header: 'Subject · to',
      cell: (n) => (
        <span className={styles.notifSubject}>
          <span className={styles.rowName}>{n.subject}</span>
          <span className={styles.notifTo}>{n.to}</span>
        </span>
      ),
    },
    { id: 'channel', header: 'Channel', width: 90, hideBelow: 'sm', cell: (n) => n.channel },
    {
      id: 'status',
      header: 'Status',
      width: 110,
      cell: (n) => (
        <Pill variant={statusVariant(n.status)} title={n.error ?? undefined}>
          {humanise(n.status)}
        </Pill>
      ),
    },
  ];

  const rowActions = hasTask('notifications.send')
    ? (n: Notification): MenuItem[] => [
        {
          id: 'resend',
          label: 'Resend',
          icon: <Icon name="refresh" size={16} />,
          onSelect: () =>
            resend.mutate(n.id, {
              onSuccess: () => toast.success(`Resent to ${n.to}`),
              onError: (e) => toast.error(errorMessage(e), { requestId: errorRequestId(e) }),
            }),
        },
      ]
    : undefined;

  if (query.isError) return <QueryError error={query.error} title="Could not load notifications" onRetry={() => void query.refetch()} />;

  return (
    <>
      <Toolbar end={<ToolbarCount>{query.isPending ? '…' : `${formatInt(total)} ${total === 1 ? 'notification' : 'notifications'}`}</ToolbarCount>}>
        <Select
          aria-label="Status"
          size="sm"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as NotificationStatus | '');
            setPage(1);
          }}
        />
      </Toolbar>
      <Table
        caption="Notifications"
        columns={columns}
        rows={rows}
        rowKey={(n) => n.id}
        loading={query.isPending}
        rowActions={rowActions}
        empty={<EmptyState icon="bell" title="No notifications yet" description="Commencement, reminder and invitation e-mails for this cycle appear here." />}
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
    </>
  );
}
