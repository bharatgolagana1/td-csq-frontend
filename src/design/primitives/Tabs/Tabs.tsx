import { type KeyboardEvent, type ReactNode, useRef } from 'react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/cn';

import { Badge } from '../Badge/Badge';
import styles from './Tabs.module.css';

export type TabItem = {
  id: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
  /** Route tab: renders a link; the active tab follows the router unless `value` is given. */
  to?: string;
  end?: boolean;
};

export type TabsProps = {
  tabs: TabItem[];
  /** Active tab id (controlled). Required for button tabs. */
  value?: string;
  onChange?: (id: string) => void;
  'aria-label'?: string;
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * WAI-ARIA tabs with a roving tabindex: Arrow keys move focus (and select, for
 * button tabs), Home/End jump. Route tabs use NavLink and activate on Enter.
 */
export function Tabs({ tabs, value, onChange, 'aria-label': ariaLabel, size = 'md', className }: TabsProps) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const enabled = tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);

  const focusIndex = (i: number, select: boolean) => {
    const tab = tabs[i];
    if (!tab) return;
    refs.current[i]?.focus();
    if (select && !tab.to) onChange?.(tab.id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, index: number) => {
    const pos = enabled.indexOf(index);
    if (pos === -1 || enabled.length === 0) return;
    let next: number | undefined;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = enabled[(pos + 1) % enabled.length];
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = enabled[(pos - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    if (next === undefined) return;
    e.preventDefault();
    focusIndex(next, true);
  };

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === value),
  );

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn(styles.root, styles[size], className)}>
      {tabs.map((tab, i) => {
        const common = {
          id: `tab-${tab.id}`,
          'aria-controls': `panel-${tab.id}`,
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKeyDown(e, i),
        };
        const inner = (
          <>
            <span className={styles.label}>{tab.label}</span>
            {tab.count !== undefined ? <Badge count={tab.count} hideZero={false} /> : null}
          </>
        );
        if (tab.to) {
          const explicit = value !== undefined ? tab.id === value : undefined;
          return (
            <NavLink
              key={tab.id}
              {...common}
              role="tab"
              ref={(el) => {
                refs.current[i] = el;
              }}
              to={tab.to}
              end={tab.end ?? true}
              tabIndex={explicit === undefined ? undefined : explicit ? 0 : -1}
              aria-selected={explicit}
              aria-disabled={tab.disabled || undefined}
              className={({ isActive }) => cn(styles.tab, (explicit ?? isActive) && styles.active, tab.disabled && styles.disabled)}
              onClick={(e) => tab.disabled && e.preventDefault()}
            >
              {inner}
            </NavLink>
          );
        }
        const selected = i === activeIndex;
        return (
          <button
            key={tab.id}
            {...common}
            role="tab"
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={selected ? 0 : -1}
            aria-selected={selected}
            disabled={tab.disabled}
            className={cn(styles.tab, selected && styles.active)}
            onClick={() => onChange?.(tab.id)}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ tabId, children, className }: { tabId: string; children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`panel-${tabId}`} aria-labelledby={`tab-${tabId}`} tabIndex={0} className={className}>
      {children}
    </div>
  );
}
