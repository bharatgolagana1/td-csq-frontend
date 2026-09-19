import type { CSSProperties, FC } from 'react';
import './Orbis.css';

export interface OrbisProps {
  /** Outer ring diameter in px. Rings inset from this. */
  size?: number;
  /** Text under the rings. Also announced to screen readers. */
  label?: string;
  /** Cover the viewport rather than sit inline. */
  fullScreen?: boolean;
}

/**
 * Orbis: three concentric rings, each drawn on three sides only, counter-rotating
 * at different speeds. Carried over from Legal Genius and recoloured to the CSQ
 * rating ramp, so the loader is built from the same palette that carries meaning
 * everywhere else in the product.
 *
 * Pure CSS. No animation library, nothing to import, and it degrades to three
 * static rings under prefers-reduced-motion.
 */
export const Orbis: FC<OrbisProps> = ({ size = 78, label, fullScreen = false }) => (
  <div
    className={fullScreen ? 'orbis-wrap orbis-wrap--full' : 'orbis-wrap'}
    role="status"
    aria-live="polite"
    aria-label={label ?? 'Loading'}
  >
    <span className="orbis" style={{ '--orbis-size': `${size}px` } as CSSProperties} />
    {label ? <span className="orbis-label">{label}</span> : null}
  </div>
);

export default Orbis;
