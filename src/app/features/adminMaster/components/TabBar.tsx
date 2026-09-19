import { useRef, type KeyboardEvent } from 'react';

export interface TabDef<T extends string> {
  id: T;
  label: string;
  /** a number worth seeing before the tab is opened, such as the approval backlog */
  count?: number;
}

export interface TabBarProps<T extends string> {
  tabs: Array<TabDef<T>>;
  active: T;
  onChange: (id: T) => void;
  label: string;
}

export function TabBar<T extends string>({ tabs, active, onChange, label }: TabBarProps<T>) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0 && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + step + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    // focus follows selection, which is what an arrow key is for in a tablist
    window.requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLButtonElement>(`#am-tab-${tabs[next].id}`)?.focus();
    });
  };

  return (
    <div className="am-tabs" role="tablist" aria-label={label} ref={ref} onKeyDown={onKeyDown}>
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            id={`am-tab-${t.id}`}
            className="am-tab"
            role="tab"
            aria-selected={selected}
            aria-controls={selected ? `am-panel-${t.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 ? <span className="am-count">{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
