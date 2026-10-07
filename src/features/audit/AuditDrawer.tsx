import { type AuditEntry } from '@/api/audit.types';
import { Button, Drawer, KeyValue, Pill, Stamp } from '@/design/primitives';
import { humanise } from '@/lib/format';

import styles from './audit.module.css';
import { actionVariant } from './AuditTable';
import { DiffTable } from './DiffTable';

export type AuditDrawerProps = {
  entry: AuditEntry | null;
  open: boolean;
  onClose: () => void;
  orgName: (id: string | null) => string | undefined;
};

/** One audit entry: who, where, what, when, and the before/after diff. */
export function AuditDrawer({ entry: e, open, onClose, orgName }: AuditDrawerProps) {
  return (
    <Drawer
      open={open && e !== null}
      onClose={onClose}
      title="Audit entry"
      description={e ? `${humanise(e.entity.replace(/[._]/g, ' '))} · ${e.entityId}` : undefined}
      width={640}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {e ? (
        <div className={styles.detail}>
          <div className={styles.statusRow}>
            <Pill variant={actionVariant(e.action)}>{humanise(e.action.replace(/\./g, ' '))}</Pill>
            <span className={styles.statusStamp}>
              <Stamp iso={e.at} />
            </span>
          </div>

          <KeyValue
            layout="rows"
            items={[
              { key: 'Actor', value: e.actorEmail ?? 'System', mono: Boolean(e.actorEmail) },
              { key: 'Actor id', value: e.actorUserId ?? '—', mono: true },
              { key: 'Organisation', value: e.orgId ? (orgName(e.orgId) ?? e.orgId) : '—', mono: Boolean(e.orgId && !orgName(e.orgId)) },
              ...(e.actorOrgId && e.actorOrgId !== e.orgId ? [{ key: 'Acting from', value: orgName(e.actorOrgId) ?? e.actorOrgId }] : []),
              { key: 'Action', value: e.action, mono: true },
              { key: 'Entity', value: `${e.entity} · ${e.entityId}`, mono: true },
              { key: 'IP', value: e.ip || '—', mono: true },
              { key: 'Request id', value: e.requestId || '—', mono: true },
              { key: 'Entry id', value: e.id, mono: true },
            ]}
          />

          <section aria-labelledby="audit-diff">
            <h3 id="audit-diff" className={styles.sectionTitle}>
              Before / after
            </h3>
            <DiffTable before={e.before} after={e.after} />
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
