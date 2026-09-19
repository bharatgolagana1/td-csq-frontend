import type { FC } from 'react';
import type { CycleState } from '../api/cycleBuilder.types';
import type { EditPolicy } from '../lib/cycleRules';

export const StateChip: FC<{ state: CycleState }> = ({ state }) => (
  <span className={`cb-chip is-${state.toLowerCase()}`}>{state.toLowerCase()}</span>
);

export interface StateBannerProps {
  state: CycleState;
  policy: EditPolicy;
  prefilledFrom: string | null;
}

export const StateBanner: FC<StateBannerProps> = ({ state, policy, prefilledFrom }) => (
  <div className={`cb-banner is-${state.toLowerCase()}`} role="note">
    <div className="cb-banner-head">
      <StateChip state={state} />
      <b>{policy.headline}</b>
    </div>
    <p>{policy.detail}</p>
    {prefilledFrom ? (
      <p className="cb-banner-sub">
        Seeded from {prefilledFrom}. Every field below is yours to change.
      </p>
    ) : null}
  </div>
);
