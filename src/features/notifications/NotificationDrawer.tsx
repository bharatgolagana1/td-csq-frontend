import { type Notification } from '@/api/notifications.types';
import { Icon } from '@/design/icons';
import { Button, Drawer, KeyValue, Pill, Stamp, statusVariant, Tag } from '@/design/primitives';
import { humanise } from '@/lib/format';

import styles from './notifications.module.css';
import { RefChips, type RefNames, shortId } from './RefChips';

export type NotificationDrawerProps = {
  notification: Notification | null;
  open: boolean;
  onClose: () => void;
  /** Present when the role holds `notifications.send`. */
  onResend?: (n: Notification) => void;
  names: RefNames;
};

/** The rendered e-mail: delivery facts, subject, plain-text body, the error when it failed. */
export function NotificationDrawer({ notification: n, open, onClose, onResend, names }: NotificationDrawerProps) {
  return (
    <Drawer
      open={open && n !== null}
      onClose={onClose}
      title="Notification"
      description={n ? `${humanise(n.template)} · ${n.channel === 'LOG' ? 'logged, not e-mailed' : 'e-mail'}` : undefined}
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {onResend && n ? (
            <Button variant="primary" icon={<Icon name="refresh" size={16} />} onClick={() => onResend(n)}>
              Resend
            </Button>
          ) : null}
        </>
      }
    >
      {n ? (
        <div className={styles.detail}>
          <div className={styles.statusRow}>
            <Pill variant={statusVariant(n.status)}>{humanise(n.status)}</Pill>
            <Tag tone="outline">{n.channel}</Tag>
            <span className={styles.statusStamp}>
              <Stamp iso={n.sentAt ?? n.createdAt} />
            </span>
          </div>

          {n.status === 'FAILED' ? (
            <section aria-labelledby="notification-error">
              <h3 id="notification-error" className={styles.sectionTitle}>
                Delivery error
              </h3>
              <div className={styles.errorBox} role="alert">
                {n.error ?? 'The transport reported a failure without a message.'}
              </div>
            </section>
          ) : null}

          <KeyValue
            layout="rows"
            items={[
              { key: 'To', value: n.to, mono: true },
              { key: 'Template', value: <Pill dot={false}>{humanise(n.template)}</Pill> },
              { key: 'Sent', value: n.sentAt ? <Stamp iso={n.sentAt} /> : 'Not sent' },
              { key: 'Queued', value: <Stamp iso={n.createdAt} /> },
              { key: 'About', value: <RefChips refs={n.refs} names={names} /> },
              ...(n.resendOf ? [{ key: 'Resend of', value: shortId(n.resendOf), mono: true }] : []),
              { key: 'Id', value: n.id, mono: true },
            ]}
          />

          <section aria-labelledby="notification-subject">
            <h3 id="notification-subject" className={styles.sectionTitle}>
              Subject
            </h3>
            <p className={styles.subjectText}>{n.subject}</p>
          </section>

          <section aria-labelledby="notification-body">
            <h3 id="notification-body" className={styles.sectionTitle}>
              Body
            </h3>
            <pre className={styles.bodyText}>{n.body}</pre>
          </section>

          {Object.keys(n.vars).length > 0 ? (
            <details className={styles.vars}>
              <summary>Template variables</summary>
              <pre>{JSON.stringify(n.vars, null, 2)}</pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
