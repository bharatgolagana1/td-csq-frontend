import { type HTMLAttributes, type ReactNode } from 'react';

import { Icon, type IconName } from '@/design/icons';
import { cn } from '@/lib/cn';

import styles from './Banner.module.css';

export type BannerTone = 'info' | 'success' | 'warn' | 'danger';

export type BannerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: BannerTone;
  title?: ReactNode;
  /** Override the tone's icon; `null` hides it. */
  icon?: IconName | null;
  /** One action at the end (a Button, usually ghost or secondary). */
  action?: ReactNode;
  children?: ReactNode;
};

const ICONS: Record<BannerTone, IconName> = { info: 'info', success: 'check', warn: 'warning', danger: 'warning' };

/**
 * Inline page-level notice (an info banner above a table, a warning on a form).
 * Warn/danger announce as alerts; info/success as status.
 */
export function Banner({ tone = 'info', title, icon, action, className, children, ...rest }: BannerProps) {
  const iconName = icon === null ? null : (icon ?? ICONS[tone]);
  return (
    <div role={tone === 'warn' || tone === 'danger' ? 'alert' : 'status'} className={cn(styles.root, styles[tone], className)} {...rest}>
      {iconName ? (
        <span className={styles.icon} aria-hidden="true">
          <Icon name={iconName} size={18} />
        </span>
      ) : null}
      <div className={styles.content}>
        {title ? <p className={styles.title}>{title}</p> : null}
        {children ? <div className={styles.text}>{children}</div> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
