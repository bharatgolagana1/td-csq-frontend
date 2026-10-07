import { useEffect, useState } from 'react';

/* Reads the design tokens the charts need from CSS variables at runtime so the
   single echarts theme follows light/dark and any token change. */

export type ChartTokens = {
  ink: string;
  ink2: string;
  muted: string;
  line: string;
  surface: string;
  grid: string;
  accent: string;
  customer: string;
  self: string;
  previous: string;
  r5: string;
  r4: string;
  r3: string;
  r2: string;
  r1: string;
  na: string;
  up: string;
  down: string;
  fontBody: string;
  fontMono: string;
};

const FALLBACK: ChartTokens = {
  ink: '#0c1416',
  ink2: '#3b4b50',
  muted: '#6b7d82',
  line: '#dfe4e6',
  surface: '#ffffff',
  grid: '#e9edee',
  accent: '#0a5c63',
  customer: '#0a5c63',
  self: '#8aa0a3',
  previous: '#c3cccf',
  r5: '#0f7a63',
  r4: '#3f9d93',
  r3: '#8aa0a3',
  r2: '#c8873c',
  r1: '#b4543c',
  na: '#9aa7ab',
  up: '#0f7a63',
  down: '#b4543c',
  fontBody: "'Lato', system-ui, sans-serif",
  fontMono: "'IBM Plex Mono', ui-monospace, monospace",
};

const VARS: Record<keyof ChartTokens, string> = {
  ink: '--ink',
  ink2: '--ink-2',
  muted: '--muted',
  line: '--line',
  surface: '--surface',
  grid: '--chart-grid',
  accent: '--accent',
  customer: '--series-customer',
  self: '--series-self',
  previous: '--series-previous',
  r5: '--r5',
  r4: '--r4',
  r3: '--r3',
  r2: '--r2',
  r1: '--r1',
  na: '--na',
  up: '--up',
  down: '--down',
  fontBody: '--font-body',
  fontMono: '--font-mono',
};

export function readChartTokens(): ChartTokens {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const out = { ...FALLBACK };
  (Object.keys(VARS) as (keyof ChartTokens)[]).forEach((key) => {
    const v = cs.getPropertyValue(VARS[key]).trim();
    if (v) out[key] = v;
  });
  return out;
}

/** Re-reads tokens when the theme attribute or the OS colour scheme changes. */
export function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(readChartTokens);
  useEffect(() => {
    const refresh = () => setTokens(readChartTokens());
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    let mql: MediaQueryList | undefined;
    try {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener?.('change', refresh);
    } catch {
      /* jsdom */
    }
    // Fonts load after first paint; re-read once they are ready.
    document.fonts?.ready.then(refresh).catch(() => undefined);
    return () => {
      observer.disconnect();
      mql?.removeEventListener?.('change', refresh);
    };
  }, []);
  return tokens;
}

export function ratingColor(t: ChartTokens, rating: 1 | 2 | 3 | 4 | 5 | null): string {
  switch (rating) {
    case 5:
      return t.r5;
    case 4:
      return t.r4;
    case 3:
      return t.r3;
    case 2:
      return t.r2;
    case 1:
      return t.r1;
    default:
      return t.na;
  }
}
