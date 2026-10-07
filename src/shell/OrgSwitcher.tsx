import { useNavigate } from 'react-router-dom';

import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Menu, type MenuItem } from '@/design/primitives/Menu/Menu';
import { cn } from '@/lib/cn';
import { humanise } from '@/lib/format';

import styles from './menus.module.css';
import { useShell } from './ShellContext';

/** Current organisation + role; a menu when the user belongs to several organisations. */
export function OrgSwitcher() {
  const { org, role, memberships, switchOrg } = useSession();
  const navigate = useNavigate();
  const { href } = useShell();

  const label = (
    <span className={styles.orgLabel}>
      <span className={styles.orgName}>{org.name}</span>
      <span className={styles.orgRole}>{humanise(role.code)}</span>
    </span>
  );

  if (memberships.length <= 1) {
    return <div className={cn(styles.trigger, styles.static)}>{label}</div>;
  }

  const items: MenuItem[] = memberships.map((m) => ({
    id: m.orgId,
    label: (
      <span className={styles.orgItem}>
        <span className={styles.orgItemName}>{m.orgName}</span>
        <span className={styles.orgItemRole}>{humanise(m.roleCode)}</span>
      </span>
    ),
    icon: m.orgId === org.id ? <Icon name="check" size={16} /> : <span className={styles.iconSpacer} />,
    onSelect: () => {
      void switchOrg(m.orgId).then(() => navigate(href('/')));
    },
  }));

  return (
    <Menu
      label="Switch organisation"
      header={<span className={styles.menuHeader}>Your organisations</span>}
      items={items}
      trigger={
        <button type="button" className={styles.trigger}>
          {label}
          <Icon name="chevron-down" size={16} className={styles.chevron} />
        </button>
      }
    />
  );
}
