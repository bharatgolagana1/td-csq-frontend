import { type ReactNode, useEffect } from 'react';

import { cn } from '@/lib/cn';

import { Breadcrumbs, type Crumb } from '../Breadcrumbs/Breadcrumbs';
import { Tabs, type TabsProps } from '../Tabs/Tabs';
import styles from './PageHeader.module.css';
import { setPageTitle } from './pageTitle';

export type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: string;
  /** One line of context under the title. */
  context?: ReactNode;
  /** Pills / tags shown beside the title. */
  meta?: ReactNode;
  actions?: ReactNode;
  tabs?: TabsProps;
  breadcrumbs?: Crumb[];
  className?: string;
};

/** Every page starts with this: eyebrow · title · one-line context · actions (§3). */
export function PageHeader({ eyebrow, title, context, meta, actions, tabs, breadcrumbs, className }: PageHeaderProps) {
  useEffect(() => {
    setPageTitle(title);
    const previous = document.title;
    document.title = `${title} · CSQ`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <header className={cn(styles.root, className)}>
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className={styles.crumbs} /> : null}
      <div className={styles.row}>
        <div className={styles.heading}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{title}</h1>
            {meta ? <div className={styles.meta}>{meta}</div> : null}
          </div>
          {context ? <p className={styles.context}>{context}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {tabs ? <Tabs {...tabs} className={cn(styles.tabs, tabs.className)} /> : null}
    </header>
  );
}
