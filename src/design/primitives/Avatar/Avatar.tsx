import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

import styles from './Avatar.module.css';

export type AvatarProps = {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <span className={cn(styles.root, styles[size], className)} aria-hidden="true" title={name}>
      {src ? <img src={src} alt="" className={styles.img} /> : <span className={styles.initials}>{initials(name)}</span>}
    </span>
  );
}
