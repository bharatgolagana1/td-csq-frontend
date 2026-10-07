import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './Card.module.css';

export type CardProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md';
  as?: 'section' | 'article' | 'div';
  children?: ReactNode;
};

export function Card({ title, subtitle, actions, footer, padding = 'md', as: Tag = 'section', className, children, ...rest }: CardProps) {
  return (
    <Tag className={cn(styles.root, className)} {...rest}>
      {title || actions ? (
        <header className={styles.header}>
          <div className={styles.heading}>
            {title ? <h3 className={styles.title}>{title}</h3> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn(styles.body, styles[`pad-${padding}`])}>{children}</div>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </Tag>
  );
}
