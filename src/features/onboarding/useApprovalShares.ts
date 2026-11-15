import { useMemo, useState } from 'react';

import { type RegistrationDetail, type ShareEntryInput } from '@/api/onboarding.types';

import { parseShareInput } from '@/lib/share';

import { round2, scaleToFit, shareFit } from './shareProjection';

/** The new operator's row; the others are keyed by their organisation id. */
export const NEW_ROW = 'new';

export type ApprovalShareRow = {
  key: string;
  code: string | null;
  name: string;
  /** What the reviewer typed. */
  input: string;
  /** Parsed; null when the input is not a share. */
  value: number | null;
  /** Why the input is not a share ("A share can’t be negative"); null when it is one. */
  error: string | null;
  isNew: boolean;
};

function initialInputs(registration: RegistrationDetail): Record<string, string> {
  const inputs: Record<string, string> = { [NEW_ROW]: registration.marketSharePct === null ? '' : String(registration.marketSharePct) };
  registration.marketShare?.operators.forEach((o) => {
    inputs[o.acoId] = String(o.sharePct);
  });
  return inputs;
}

/**
 * The airport's share set as the approval will write it: the operators active
 * there (their current shares) and the new one (the requested share), each
 * editable, with the live total. Approval is possible once it totals 100.
 */
export function useApprovalShares(registration: RegistrationDetail) {
  const [inputs, setInputs] = useState(() => initialInputs(registration));
  const operators = useMemo(() => registration.marketShare?.operators ?? [], [registration.marketShare]);

  const rows = useMemo<ApprovalShareRow[]>(() => {
    const row = (key: string, code: string | null, name: string, isNew: boolean): ApprovalShareRow => {
      const input = inputs[key] ?? '';
      const parsed = parseShareInput(input);
      return { key, code, name, input, value: parsed.value, error: parsed.error, isNew };
    };
    return [...operators.map((o) => row(o.acoId, o.code, o.name, false)), row(NEW_ROW, null, registration.organisation.name, true)];
  }, [inputs, operators, registration.organisation.name]);

  const total = round2(rows.reduce((sum, r) => sum + (r.value ?? 0), 0));
  const fit = shareFit(total);
  const invalid = rows.some((r) => r.value === null);
  const newShare = rows.find((r) => r.isNew)?.value ?? null;
  const others = rows.filter((r) => !r.isNew);

  const setShare = (key: string, input: string) => setInputs((prev) => ({ ...prev, [key]: input }));

  /** One click to 100: the others scaled into what the new operator leaves; a sole operator gets 100. */
  const fitOthers = () => {
    if (others.length === 0) return setShare(NEW_ROW, '100');
    if (newShare === null || others.some((r) => r.value === null)) return;
    const scaled = scaleToFit(
      others.map((r) => r.value ?? 0),
      100 - newShare,
    );
    setInputs((prev) => ({ ...prev, ...Object.fromEntries(others.map((r, i) => [r.key, String(scaled[i] ?? 0)])) }));
  };

  const shares: ShareEntryInput[] = others.map((r) => ({ acoId: r.key, sharePct: r.value ?? 0 }));
  return {
    rows,
    total,
    fit,
    invalid,
    setShare,
    fitOthers,
    /** Whether the helper has something to do. */
    canFit: !invalid && !fit.ok && newShare !== null,
    soleOperator: others.length === 0,
    canApprove: !invalid && fit.ok,
    body: { marketSharePct: newShare ?? 0, shares },
  };
}
