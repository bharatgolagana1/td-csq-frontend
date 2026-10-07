import { type ReactNode } from 'react';

import { type Notification } from '@/api/notifications.types';
import { Icon } from '@/design/icons';
import { type Column, EmptyState, type MenuItem, Pill, type SortState, Stamp, statusVariant, Table, Tag, useToast } from '@/design/primitives';
import { humanise } from '@/lib/format';

import styles from './notifications.module.css';
import { RefChips, type RefNames } from './RefChips';

export type NotificationsTableProps = {
  rows: Notification[];
  loading: boolean;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  onOpen: (n: Notification) => void;
  onResend?: (n: Notification) => void;
  names: RefNames;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
};

/** Sent at · message (subject, recipient, ref chips) · template · channel · status. */
export function NotificationsTable({ rows, loading, sort, onSortChange, onOpen, onResend, names, emptyTitle, emptyDescription, emptyAction }: NotificationsTableProps) {
  const toast = useToast();

  const columns: Column<Notification>[] = [
    { id: 'createdAt', header: 'Sent at', mono: true, sortable: true, cell: (n) => <Stamp iso={n.sentAt ?? n.createdAt} /> },
    {
      id: 'message',
      header: 'Message',
      cell: (n) => (
        <span className={styles.message}>
          <span className={styles.subject}>{n.subject}</span>
          <span className={styles.meta}>
            <span className={styles.to}>{n.to}</span>
            {/* Ref chips ride the meta line (hidden at phone width; the drawer shows them in full). */}
            <RefChips refs={n.refs} names={names} compact className={styles.metaChips} />
          </span>
          {/* Phone width: the Status column is hidden, so the pill moves in here. */}
          <Pill variant={statusVariant(n.status)} size="sm" className={styles.inlineStatus}>
            {humanise(n.status)}
          </Pill>
        </span>
      ),
    },
    { id: 'template', header: 'Template', width: 170, sortable: true, hideBelow: 'sm', cell: (n) => <Pill dot={false}>{humanise(n.template)}</Pill> },
    { id: 'channel', header: 'Channel', width: 90, hideBelow: 'md', cell: (n) => <Tag tone="outline">{n.channel}</Tag> },
    { id: 'status', header: 'Status', width: 110, sortable: true, hideBelow: 'sm', cell: (n) => <Pill variant={statusVariant(n.status)}>{humanise(n.status)}</Pill> },
  ];

  const rowActions = (n: Notification): MenuItem[] => [
    { id: 'view', label: 'View e-mail', icon: <Icon name="eye" size={16} />, onSelect: () => onOpen(n) },
    {
      id: 'copy',
      label: 'Copy recipient',
      icon: <Icon name="mail" size={16} />,
      onSelect: () => {
        void navigator.clipboard?.writeText(n.to).then(() => toast.info('E-mail copied'));
      },
    },
    ...(onResend ? [{ id: 'sep', separator: true } as const, { id: 'resend', label: 'Resend', icon: <Icon name="refresh" size={16} />, onSelect: () => onResend(n) }] : []),
  ];

  return (
    <Table
      caption="Notifications"
      className={styles.tableWrap}
      columns={columns}
      rows={rows}
      rowKey={(n) => n.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={onOpen}
      rowActions={rowActions}
      empty={<EmptyState icon="bell" title={emptyTitle ?? 'No notifications match'} description={emptyDescription ?? 'Try another search, template, status or cycle.'} action={emptyAction} />}
    />
  );
}
