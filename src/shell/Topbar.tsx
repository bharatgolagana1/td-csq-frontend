import { useTheme } from '@/app/theme';
import { Icon } from '@/design/icons';
import { IconButton } from '@/design/primitives/IconButton/IconButton';
import { usePageTitle } from '@/design/primitives/PageHeader/pageTitle';

import { OrgSwitcher } from './OrgSwitcher';
import styles from './Topbar.module.css';
import { UserMenu } from './UserMenu';

export type TopbarProps = {
  onOpenNav: () => void;
};

/** Page title slot · search placeholder · OrgSwitcher · theme toggle · UserMenu. */
export function Topbar({ onOpenNav }: TopbarProps) {
  const title = usePageTitle();
  const { resolved, toggle } = useTheme();

  return (
    <header className={styles.root}>
      <div className={styles.start}>
        <IconButton label="Open menu" icon={<Icon name="menu" />} onClick={onOpenNav} className={styles.menuButton} />
        <h2 className={styles.title} aria-live="polite">
          {title}
        </h2>
      </div>
      <div className={styles.search}>
        <Icon name="search" size={16} className={styles.searchIcon} />
        <input type="search" className={styles.searchInput} placeholder="Search operators, cycles, users…" aria-label="Search" disabled title="Search is coming soon" />
        <kbd className={styles.kbd}>⌘K</kbd>
      </div>
      <div className={styles.end}>
        <OrgSwitcher />
        <IconButton label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} icon={<Icon name={resolved === 'dark' ? 'sun' : 'moon'} />} onClick={toggle} />
        <UserMenu />
      </div>
    </header>
  );
}
