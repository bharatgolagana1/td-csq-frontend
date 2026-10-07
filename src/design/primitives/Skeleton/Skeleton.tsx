import { type CSSProperties } from 'react';

import { cn } from '@/lib/cn';

import styles from './Skeleton.module.css';

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  /** Render N text lines (last one shorter). */
  lines?: number;
  circle?: boolean;
  className?: string;
};

export function Skeleton({ width, height = 14, radius, lines, circle, className }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <span className={cn(styles.lines, className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={styles.block}
            style={{ height, width: i === lines - 1 ? '60%' : (width ?? '100%'), borderRadius: radius }}
          />
        ))}
      </span>
    );
  }
  const style: CSSProperties = {
    width: width ?? (circle ? height : '100%'),
    height,
    borderRadius: circle ? '50%' : radius,
  };
  return <span className={cn(styles.block, className)} style={style} aria-hidden="true" />;
}
