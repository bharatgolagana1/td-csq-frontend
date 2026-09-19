import type { CSSProperties, FC } from 'react';
import './Orbis.css';

export interface OrbisProps {
  /** Dot diameter in px. Gap scales from it. */
  size?: number;
  /** Dot colour. Defaults to the CSQ accent. */
  color?: string;
  /** Text beneath the dots. Also announced to screen readers. */
  label?: string;
  /** Cover the viewport rather than sit inline. */
  fullScreen?: boolean;
}

/**
 * Orbis: three dots scaling and fading in sequence, carried over from Legal
 * Genius (shared/components/DotsLoader) with its timing intact and the colour
 * moved to the CSQ palette.
 *
 * Pure CSS rather than the original's injected keyframes: a runtime
 * `document.head.appendChild` on every mount is avoidable work, and it breaks
 * under a strict style-src CSP.
 */
export const Orbis: FC<OrbisProps> = ({ size = 12, color, label, fullScreen = false }) => (
  <div
    className={fullScreen ? 'orbis-wrap orbis-wrap--full' : 'orbis-wrap'}
    role="status"
    aria-live="polite"
    aria-label={label ?? 'Loading'}
  >
    <span
      className="orbis"
      style={
        {
          '--orbis-dot': `${size}px`,
          ...(color ? { '--orbis-color': color } : {}),
        } as CSSProperties
      }
    >
      <i />
      <i />
      <i />
    </span>
    {label ? <span className="orbis-label">{label}</span> : null}
  </div>
);

export default Orbis;
