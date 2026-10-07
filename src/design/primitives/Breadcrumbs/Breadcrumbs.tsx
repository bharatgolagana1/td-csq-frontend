import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './Breadcrumbs.module.css';

export type Crumb = { label: ReactNode; to?: string };

export type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn(styles.root, className)}>
      <ol className={styles.list}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={i}>
              <li className={styles.item} aria-current={last ? 'page' : undefined}>
                {item.to && !last ? (
                  <Link to={item.to} className={styles.link}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn(styles.text, last && styles.current)}>{item.label}</span>
                )}
              </li>
              {!last ? (
                <li aria-hidden="true" className={styles.sep}>
                  <Icon name="chevron-right" size={16} />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
