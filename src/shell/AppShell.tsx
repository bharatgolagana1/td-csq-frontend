import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Drawer } from '@/design/primitives/Drawer/Drawer';

import styles from './AppShell.module.css';
import { CycleStrip, type CycleStripProps } from './CycleStrip';
import { ShellProvider } from './ShellContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export type AppShellProps = {
  /** Defaults to the route <Outlet/>. */
  children?: ReactNode;
  /** Operator cycle strip under the topbar (null hides it). */
  cycle?: CycleStripProps | null;
  /** Mount prefix (dev gallery). */
  basePath?: string;
};

/**
 * Rail + topbar + content. Rail is 240px, collapses to a 64px icon rail under
 * 1100px and moves into a drawer under 760px (ARCHITECTURE §2). Content is
 * capped at 1440px with 24px padding (16px gutters on phones).
 */
export function AppShell({ children, cycle, basePath }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const closeNav = useCallback(() => setNavOpen(false), []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <ShellProvider basePath={basePath ?? ''}>
      <div className={styles.shell}>
        <a href="#main" className={styles.skip}>
          Skip to content
        </a>
        <aside className={styles.rail} aria-label="Primary">
          <Sidebar />
        </aside>
        <div className={styles.main}>
          <Topbar onOpenNav={() => setNavOpen(true)} />
          {cycle ? <CycleStrip {...cycle} /> : null}
          <main id="main" className={styles.content} tabIndex={-1}>
            <div className={styles.inner}>{children ?? <Outlet />}</div>
          </main>
        </div>
        <Drawer open={navOpen} onClose={closeNav} title="Menu" side="left" width={480} className={styles.navDrawer}>
          <Sidebar onNavigate={closeNav} inDrawer />
        </Drawer>
      </div>
    </ShellProvider>
  );
}
