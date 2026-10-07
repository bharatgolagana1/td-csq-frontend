import { useCallback, useEffect, useMemo, useState } from 'react';

import { type MarketShare } from '@/api/marketshare.types';
import { type Operator } from '@/api/operators.types';

import { parseShare, sumShares, totalFit } from './shareMath';

export type ShareRow = {
  acoId: string;
  code: string;
  name: string;
  /** What the user typed. */
  input: string;
  /** Parsed value; null when the input is invalid. */
  value: number | null;
  /** Operator is at the airport but not in the saved set. */
  added: boolean;
};

function initialDraft(share: MarketShare | undefined, operators: Operator[] | undefined): Record<string, string> {
  const draft: Record<string, string> = {};
  share?.entries.forEach((e) => {
    draft[e.acoId] = String(e.sharePct);
  });
  operators?.forEach((o) => {
    if (o.status === 'ACTIVE' && !(o.id in draft)) draft[o.id] = '';
  });
  return draft;
}

/**
 * Owns the editable copy of one share set: rows (saved entries plus the
 * airport's active operators), the live total, the 100 % guard and dirtiness.
 * Resets whenever a different set (airport / cycle) loads.
 */
export function useShareEditor(share: MarketShare | undefined, operators: Operator[] | undefined) {
  const [draft, setDraft] = useState<Record<string, string>>(() => initialDraft(share, operators));
  const initial = useMemo(() => initialDraft(share, operators), [share, operators]);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const setShare = useCallback((acoId: string, input: string) => setDraft((d) => ({ ...d, [acoId]: input })), []);
  const reset = useCallback(() => setDraft(initial), [initial]);

  const rows = useMemo<ShareRow[]>(() => {
    const byId = new Map<string, { code: string; name: string; saved: boolean }>();
    share?.entries.forEach((e) => byId.set(e.acoId, { code: e.code, name: e.name, saved: true }));
    operators?.forEach((o) => {
      if (!byId.has(o.id) && o.status === 'ACTIVE') byId.set(o.id, { code: o.code, name: o.name, saved: false });
    });
    return Array.from(byId.entries()).map(([acoId, meta]) => {
      const input = draft[acoId] ?? '';
      return { acoId, code: meta.code, name: meta.name, input, value: parseShare(input), added: !meta.saved };
    });
  }, [share, operators, draft]);

  const total = useMemo(() => sumShares(rows.map((r) => r.value)), [rows]);
  const fit = totalFit(total);
  const invalid = rows.some((r) => r.value === null);
  const dirty = rows.some((r) => (initial[r.acoId] ?? '') !== r.input);
  const entries = useMemo(() => rows.map((r) => ({ acoId: r.acoId, sharePct: r.value ?? 0 })), [rows]);

  return { rows, total, fit, invalid, dirty, entries, setShare, reset, canSave: dirty && !invalid && fit.ok && rows.length > 0 };
}
