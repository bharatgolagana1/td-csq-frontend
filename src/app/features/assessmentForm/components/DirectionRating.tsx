import type { CSSProperties, FC } from 'react';
import type { DirectionCode, RatingValue } from '../api/assessmentForm.types';
import {
  DIRECTION_LABEL,
  NA_STEP,
  RATING_STEPS,
  ratingColor,
  ratingLabel,
} from '../assessmentForm.logic';

export interface DirectionRatingProps {
  parameterId: string;
  direction: DirectionCode;
  value: RatingValue | undefined;
  onChange: (value: RatingValue) => void;
  /** read out to screen readers in place of the visual label pair */
  groupLabel: string;
  /** briefly ringed after a jump from the missing list */
  targeted: boolean;
  onRegister: (el: HTMLDivElement | null) => void;
}

/**
 * One direction of one question: a five point scale plus NA, on a phone.
 *
 * Selection is shown as a tint plus a ring plus a bold numeral rather than a
 * solid fill, because a solid Good or Fair cannot carry legible white text and
 * a scale where only some steps are readable is worse than one with none.
 * The chosen word is spelled out beside the direction, so the numerals never
 * have to be decoded from memory.
 */
export const DirectionRating: FC<DirectionRatingProps> = ({
  parameterId,
  direction,
  value,
  onChange,
  groupLabel,
  targeted,
  onRegister,
}) => {
  const name = `${parameterId}|${direction}`;

  const step = (option: { value: RatingValue; label: string }, isNa: boolean) => {
    const checked = value === option.value;
    return (
      <label className={isNa ? 'af-seg af-seg--na' : 'af-seg'} key={String(option.value)}>
        <input
          className="af-seg-input"
          type="radio"
          name={name}
          value={String(option.value)}
          checked={checked}
          onChange={() => onChange(option.value)}
        />
        <span
          className="af-seg-box"
          style={{ '--af-seg': ratingColor(option.value) } as CSSProperties}
        >
          <span className="af-seg-num" aria-hidden="true">{isNa ? 'NA' : option.value}</span>
          <span className="af-vis-hidden">{option.label}</span>
        </span>
      </label>
    );
  };

  return (
    <div className={targeted ? 'af-dir is-target' : 'af-dir'} ref={onRegister}>
      <fieldset className="af-fieldset">
        <legend className="af-vis-hidden">{groupLabel}</legend>

        <div className="af-dir-head">
          <span className="af-dir-name">{DIRECTION_LABEL[direction]}</span>
          {value === undefined ? (
            <span className="af-dir-value af-dir-value--empty">Not answered</span>
          ) : (
            <span className="af-dir-value">
              <i style={{ background: ratingColor(value) }} aria-hidden="true" />
              {ratingLabel(value)}
            </span>
          )}
        </div>

        <div className="af-scale">
          <div className="af-scale-main">{RATING_STEPS.map((s) => step(s, false))}</div>
          <div className="af-scale-na">{step(NA_STEP, true)}</div>
        </div>

        <div className="af-anchors" aria-hidden="true">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </fieldset>
    </div>
  );
};

export default DirectionRating;
