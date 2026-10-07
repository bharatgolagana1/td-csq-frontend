import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { Avatar } from '@/design/primitives/Avatar/Avatar';
import { Menu } from '@/design/primitives/Menu/Menu';
import { humanise } from '@/lib/format';

import styles from './menus.module.css';

/** Avatar trigger → name, e-mail, role, sign out. */
export function UserMenu() {
  const { user, role, org, signOut } = useSession();
  return (
    <Menu
      label="Account"
      header={
        <span className={styles.userHeader}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userEmail}>{user.email}</span>
          <span className={styles.userRole}>
            {humanise(role.code)} · {org.name}
          </span>
        </span>
      }
      items={[{ id: 'signout', label: 'Sign out', icon: <Icon name="logout" size={18} />, onSelect: signOut }]}
      trigger={
        <button type="button" className={styles.userTrigger} aria-label={`Account: ${user.name}`}>
          <Avatar name={user.name} />
          <Icon name="chevron-down" size={16} className={styles.chevron} />
        </button>
      }
    />
  );
}
