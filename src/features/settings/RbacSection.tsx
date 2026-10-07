import { useNavigate } from 'react-router-dom';

import { type Settings } from '@/api/types';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Button, KeyValue } from '@/design/primitives';
import { formatInt } from '@/lib/format';

import { SectionCard } from './SectionCard';
import styles from './settings.module.css';

/** Access control: the RBAC version is system-managed (bumped by every Role → Task matrix save) and shown read-only. */
export function RbacSection({ settings }: { settings: Settings }) {
  const { hasTask } = useSession();
  const navigate = useNavigate();
  return (
    <SectionCard id="rbac" title="Access control" subtitle="Managed by the system; shown for support.">
      <div className={styles.readonly}>
        <div>
          <span className={styles.version} aria-describedby="rbac-version-label">
            {formatInt(settings.rbacVersion)}
          </span>
          <span id="rbac-version-label" className={styles.versionLabel}>
            RBAC version
          </span>
        </div>
        <KeyValue
          layout="rows"
          items={[
            { key: 'What it is', value: 'A counter bumped every time the Role → Task matrix is saved. Sessions compare it on each request and pick up new permissions without signing out.' },
            { key: 'How to change it', value: 'Save the matrix; it cannot be edited here.' },
          ]}
        />
        {hasTask('roles.view') ? (
          <div>
            {/* Route-relative so the same page works under the dev shell's prefix. */}
            <Button variant="secondary" size="sm" iconRight={<Icon name="chevron-right" size={16} />} onClick={() => navigate('../users/roles')}>
              Open the Role → Task matrix
            </Button>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
