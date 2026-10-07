import { NavLink } from 'react-router-dom';

import { visibleSections } from '@/app/nav';
import { useSession } from '@/auth/session';
import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { useShell } from './ShellContext';
import styles from './Sidebar.module.css';

export type SidebarProps = {
  onNavigate?: () => void;
  /** Inside the phone drawer: always show labels. */
  inDrawer?: boolean;
};

/** Sections and items from app/nav.ts, gated by the session's tasks (§4). */
export function Sidebar({ onNavigate, inDrawer }: SidebarProps) {
  const { tasks, org } = useSession();
  const { href } = useShell();
  const sections = visibleSections(tasks);

  return (
    <nav className={cn(styles.root, inDrawer && styles.inDrawer)} aria-label="Sections">
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          CSQ
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Cargo Service Quality</span>
          <span className={styles.brandOrg}>{org.name}</span>
        </span>
      </div>
      {sections.map((section) => (
        <div key={section.id} className={styles.section}>
          {section.label ? <p className={styles.sectionLabel}>{section.label}</p> : null}
          <ul className={styles.list}>
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={href(item.to)}
                  end={item.end ?? false}
                  title={item.label}
                  onClick={onNavigate}
                  className={({ isActive }) => cn(styles.item, isActive && styles.active)}
                >
                  <Icon name={item.icon} className={styles.icon} />
                  <span className={styles.label}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
