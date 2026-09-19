import type { FC } from 'react';
import { plural } from '../api/sampling.logic';

interface Props {
  selectedCount: number;
  visibleCount: number;
  visibleSelectedCount: number;
  minimum: number;
  onSelectAllVisible: () => void;
  onClear: () => void;
  onRemoveSelected: () => void;
  canRemove: boolean;
  busy: boolean;
}

export const SelectionBar: FC<Props> = ({
  selectedCount,
  visibleCount,
  visibleSelectedCount,
  minimum,
  onSelectAllVisible,
  onClear,
  onRemoveSelected,
  canRemove,
  busy,
}) => {
  if (selectedCount === 0) return null;
  const canSelectAllVisible = visibleCount > 0 && visibleSelectedCount < visibleCount;

  return (
    <div className="smp-selbar">
      {/* The running count is the one number the operator is working towards,
          so it is announced rather than only drawn. */}
      <span className="n" role="status">
        {selectedCount} of {minimum} selected
      </span>

      {canSelectAllVisible ? (
        <button type="button" className="smp-btn smp-btn--ghost" onClick={onSelectAllVisible}>
          Select all {visibleCount} listed
        </button>
      ) : null}

      <button type="button" className="smp-btn smp-btn--ghost" onClick={onClear}>
        Clear selection
      </button>

      <span className="spacer" />

      {canRemove ? (
        <button type="button" className="smp-btn smp-btn--danger" onClick={onRemoveSelected} disabled={busy}>
          Remove {selectedCount} {plural(selectedCount, 'contact', 'contacts')}
        </button>
      ) : null}
    </div>
  );
};

export default SelectionBar;
