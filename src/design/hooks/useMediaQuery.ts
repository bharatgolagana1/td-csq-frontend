import { useEffect, useState } from 'react';

function matches(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return Boolean(window.matchMedia(query)?.matches);
  } catch {
    return false;
  }
}

/** Phone-width breakpoint shared by the shell (drawer) and the pickers (bottom sheet). */
export const PHONE_QUERY = '(max-width: 759px)';

/** Tracks a media query; `false` where matchMedia is missing (jsdom). */
export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(() => matches(query));
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    let mql: MediaQueryList | undefined;
    try {
      mql = window.matchMedia(query);
    } catch {
      return;
    }
    if (!mql) return;
    const list = mql;
    const onChange = () => setValue(Boolean(list.matches));
    onChange();
    list.addEventListener?.('change', onChange);
    return () => list.removeEventListener?.('change', onChange);
  }, [query]);
  return value;
}
