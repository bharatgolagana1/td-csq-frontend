import type { FC } from 'react';
import type { ApprovalMode, FormScope, OperatorState } from '../api/adminMaster.types';
import { DIRECTION_LABEL, SCOPE_DIRECTIONS } from '../adminMaster.logic';

const STATE_META: Record<OperatorState, { label: string; cls: string }> = {
  REGISTERED: { label: 'Registered', cls: 'am-tag am-tag--registered' },
  PENDING_APPROVAL: { label: 'Pending approval', cls: 'am-tag am-tag--pending' },
  ACTIVE: { label: 'Active', cls: 'am-tag am-tag--active' },
  SUSPENDED: { label: 'Suspended', cls: 'am-tag am-tag--suspended' },
};

export const StateTag: FC<{ state: OperatorState }> = ({ state }) => (
  <span className={STATE_META[state].cls}>
    <i />
    {STATE_META[state].label}
  </span>
);

export const FORM_SCOPE_LABEL: Record<FormScope, string> = {
  INTERNATIONAL: 'International',
  DOMESTIC: 'Domestic',
  BOTH: 'International and domestic',
};

export const APPROVAL_MODE_LABEL: Record<ApprovalMode, string> = {
  AUTO: 'Automatic',
  ACFI_REVIEW: 'ACFI review',
};

/** The scope decides what a direction is called, so it is spelled out next to it. */
export const ScopeDirections: FC<{ scope: FormScope | null }> = ({ scope }) => {
  if (scope === null) return <span className="am-hint">Not set</span>;
  const directions =
    scope === 'BOTH'
      ? [...SCOPE_DIRECTIONS.INTERNATIONAL, ...SCOPE_DIRECTIONS.DOMESTIC]
      : SCOPE_DIRECTIONS[scope];
  return (
    <>
      <div style={{ fontSize: 13 }}>{FORM_SCOPE_LABEL[scope]}</div>
      <div className="am-op-sub">{directions.map((d) => DIRECTION_LABEL[d]).join(' · ')}</div>
    </>
  );
};
