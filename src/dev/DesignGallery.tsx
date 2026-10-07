import { Link, Outlet } from 'react-router-dom';

import { useTheme } from '@/app/theme';
import { Icon } from '@/design/icons';
import { Button } from '@/design/primitives/Button/Button';

import styles from './gallery.module.css';
import { ChartsSection } from './sections/ChartsSection';
import { ControlsSection } from './sections/ControlsSection';
import { DatesSection } from './sections/DatesSection';
import { DisplaySection } from './sections/DisplaySection';
import { IconsSection } from './sections/IconsSection';
import { NavigationSection } from './sections/NavigationSection';
import { OverlaysSection } from './sections/OverlaysSection';
import { StatusSection } from './sections/StatusSection';
import { TableSection } from './sections/TableSection';
import { TokensSection } from './sections/TokensSection';

/* DEV ONLY — /dev/design. Every primitive in every state, the charts with
   sample data, and (under /shell) the full AppShell with a mocked session. */

const SECTIONS = [
  ['tokens', 'Tokens & type'],
  ['icons', 'Icons'],
  ['controls', 'Form controls'],
  ['dates', 'Dates'],
  ['status', 'Status'],
  ['display', 'Display'],
  ['navigation', 'Navigation'],
  ['table', 'Table'],
  ['overlays', 'Overlays & toasts'],
  ['charts', 'Charts'],
] as const;

export function DesignGalleryLayout() {
  return <Outlet />;
}

export function DesignGallery() {
  const { resolved, toggle } = useTheme();
  return (
    <div className={styles.page}>
      <nav className={styles.index} aria-label="Gallery sections">
        <h1 className={styles.indexTitle}>CSQ design gallery</h1>
        <ul className={styles.indexList}>
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className={styles.indexLink}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.indexActions}>
          <Button variant="secondary" size="sm" icon={<Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={16} />} onClick={toggle}>
            {resolved === 'dark' ? 'Light theme' : 'Dark theme'}
          </Button>
          <Link to="/dev/design/shell">
            <Button variant="primary" size="sm" full iconRight={<Icon name="chevron-right" size={16} />}>
              Open the app shell
            </Button>
          </Link>
        </div>
      </nav>
      <main className={styles.content}>
        <TokensSection />
        <IconsSection />
        <ControlsSection />
        <DatesSection />
        <StatusSection />
        <DisplaySection />
        <NavigationSection />
        <TableSection />
        <OverlaysSection />
        <ChartsSection />
      </main>
    </div>
  );
}
