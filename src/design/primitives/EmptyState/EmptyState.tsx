import { type ReactNode } from 'react';

import { Icon, type IconName } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './EmptyState.module.css';

export type EmptyStateProps = {
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  /** One primary action, per ARCHITECTURE §3. */
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function EmptyState({ icon = 'info', title, description, action, size = 'md', className }: EmptyStateProps) {
  return (
    <div className={cn(styles.root, styles[size], className)}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
