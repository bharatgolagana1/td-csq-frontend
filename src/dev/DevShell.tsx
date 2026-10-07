import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { AuthProvider } from '@/auth/session';
import { Icon } from '@/design/icons';
import { AppShell } from '@/shell/AppShell';
import { type CycleStripProps } from '@/shell/CycleStrip';

import styles from './gallery.module.css';
import { installMockApi } from './mockApi';
import { type DevRole, mockSession } from './mockSession';

/* DEV ONLY — the full AppShell with a mocked session and a mocked API, mounted
   at /dev/design/shell so every real feature page can be reviewed without Keycloak. */

const ROLE_KEY = 'csq.dev.role';

function readRole(): DevRole {
  try {
    const v = sessionStorage.getItem(ROLE_KEY);
    return v === 'operator' || v === 'airport' ? v : 'platform';
  } catch {
    return 'platform';
  }
}

const SAMPLE_CYCLE: CycleStripProps = {
  cycleName: 'CSQ 2026 H2',
  cycleCode: 'CSQ-26H2',
  phase: 'SAMPLING_OPEN',
  deadlineAt: new Date(Date.now() + 3 * 86_400_000 + 4 * 3_600_000).toISOString(),
  deadlineLabel: 'Sampling closes',
  selected: 43,
  required: 50,
};

export function DevShell() {
  const [role, setRole] = useState<DevRole>(readRole);
  const session = useMemo(() => mockSession(role), [role]);
  const qc = useQueryClient();

  useEffect(() => {
    const restore = installMockApi(session);
    qc.clear();
    return restore;
  }, [session, qc]);

  const choose = (r: DevRole) => {
    try {
      sessionStorage.setItem(ROLE_KEY, r);
    } catch {
      /* ignore */
    }
    setRole(r);
  };

  return (
    <>
      <div className={styles.devBar} role="region" aria-label="Design gallery controls">
        <Link to="/dev/design" className={styles.devBarLink}>
          <Icon name="chevron-left" size={16} /> Gallery
        </Link>
        <span className={styles.devBarLabel}>Mocked session · API mocked</span>
        <div className={styles.devBarRoles} role="group" aria-label="Role">
          {(['platform', 'operator', 'airport'] as DevRole[]).map((r) => (
            <button key={r} type="button" className={styles.devBarRole} aria-pressed={role === r} onClick={() => choose(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <AuthProvider key={role} session={session}>
        <AppShell basePath="/dev/design/shell" cycle={role === 'operator' ? SAMPLE_CYCLE : null} />
      </AuthProvider>
    </>
  );
}
