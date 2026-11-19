import { forwardRef, type KeyboardEvent, type SelectHTMLAttributes, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { useOutsideClick } from '@/design/hooks/useOutsideClick';
import { Icon } from '@/design/icons';
import { cn } from '@/lib/cn';

import { type SelectOption } from './Select';
import styles from './Select.module.css';

type Props = SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] };

/** Native form events and refs, with a themed option menu instead of the OS popup. */
export const SelectControl = forwardRef<HTMLSelectElement, Props>(function SelectControl(
  { options, className, onChange, onBlur, onKeyDown, onClick, onPointerDown, id: idProp, ...rest }, forwardedRef,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const typed = useRef({ text: '', at: 0 });
  const expanded = open && !rest.disabled;
  useOutsideClick([rootRef], () => setOpen(false), expanded);

  // Stay inside the field's DOM and theme context (also inside drawers and time pickers).
  // Fixed positioning avoids clipping by scrolling containers and matches the trigger width.
  useLayoutEffect(() => {
    if (!expanded) return;
    const update = () => {
      const select = selectRef.current;
      const list = listRef.current;
      if (!select || !list) return;
      const rect = select.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 14;
      const above = rect.top - 14;
      const down = below >= Math.min(320, list.scrollHeight) || below >= above;
      list.style.width = `${Math.min(rect.width, window.innerWidth - 16)}px`;
      list.style.maxHeight = `${Math.max(0, Math.min(320, down ? below : above))}px`;
      list.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8))}px`;
      list.style.top = `${down ? rect.bottom + 6 : Math.max(8, rect.top - list.offsetHeight - 6)}px`;
    };
    update();
    const onScroll = (event: Event) => { if (!listRef.current?.contains(event.target as Node)) update(); };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', onScroll, true);
    const observer = new ResizeObserver(update);
    if (selectRef.current) observer.observe(selectRef.current);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', onScroll, true);
      observer.disconnect();
    };
  }, [expanded, options.length]);
  useEffect(() => {
    if (expanded) listRef.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }, [expanded, active]);

  const show = (last = false) => {
    const index = options.findIndex((option) => option.value === selectRef.current?.value && !option.disabled);
    const available = options.map((option, i) => option.disabled ? -1 : i).filter((i) => i >= 0);
    setActive(index >= 0 ? index : (last ? available.at(-1) : available[0]) ?? 0);
    typed.current = { text: '', at: 0 };
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    const select = selectRef.current;
    if (!select || !option || option.disabled) return;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    setOpen(false);
    select.focus({ preventScroll: true });
  };
  const handleKey = (event: KeyboardEvent<HTMLSelectElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'F4') {
      event.preventDefault();
      if (expanded) setOpen(false);
      else show();
      return;
    }
    if (event.key === 'Tab' || event.key === 'Escape') {
      if (expanded && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); }
      setOpen(false);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!expanded) { show(event.key === 'ArrowUp' || event.key === 'End'); return; }
      if (event.key === 'Enter' || event.key === ' ') { choose(active); return; }
      const available = options.map((option, i) => option.disabled ? -1 : i).filter((i) => i >= 0);
      const position = available.indexOf(active);
      const next = event.key === 'Home' ? available[0] : event.key === 'End' ? available.at(-1)
        : available[(position + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length];
      if (next !== undefined) setActive(next);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + event.key.toLowerCase(), at: now };
      const index = options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(typed.current.text));
      if (index >= 0) { setActive(index); setOpen(true); }
    }
  };
  return (
    <div ref={rootRef} className={styles.anchor}>
      <select
        {...rest}
        ref={(node) => {
          selectRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        id={id}
        role="combobox"
        className={cn(styles.select, className)}
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-options` : undefined}
        aria-haspopup="listbox"
        aria-activedescendant={expanded && options[active] ? `${id}-option-${active}` : undefined}
        onChange={(event) => { setOpen(false); onChange?.(event); }}
        onBlur={(event) => { setOpen(false); onBlur?.(event); }}
        onKeyDown={handleKey}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (!event.defaultPrevented) { event.preventDefault(); event.currentTarget.focus(); }
        }}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) { event.preventDefault(); if (expanded) setOpen(false); else show(); }
        }}
      >
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled} aria-hidden={expanded || undefined}>{option.label}</option>)}
      </select>
      {expanded ? (
        <ul ref={listRef} id={`${id}-options`} role="listbox" aria-label={rest['aria-label'] ?? selectRef.current?.labels?.[0]?.textContent ?? 'Options'} className={styles.options} onMouseDown={(event) => event.preventDefault()}>
          {options.map((option, index) => (
            <li key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === selectRef.current?.value}
              aria-disabled={option.disabled || undefined} data-active={index === active || undefined} className={styles.option}
              onMouseMove={() => { if (!option.disabled) setActive(index); }} onClick={() => choose(index)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(index); } }}>
              <span>{option.label}</span>
              {option.value === selectRef.current?.value ? <Icon name="check" size={16} /> : null}
            </li>
          ))}
          {options.length === 0 ? <li className={styles.empty}>No options available</li> : null}
        </ul>
      ) : null}
    </div>
  );
});
