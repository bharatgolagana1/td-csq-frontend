import type { FC } from 'react';
import '../../theme/tokens.css';

/**
 * Airport master data. Reference data owned by the platform admin: create,
 * edit and bulk upload, validated against IATA codes.
 *
 * Placeholder until the reference-data API lands. It exists now because
 * routes/index.tsx already spreads AirportRoute into the route table, and the
 * missing module was breaking the production build.
 */
export const AirportsPage: FC = () => (
  <div style={{ padding: '24px', fontFamily: 'var(--csq-font)' }}>
    <div
      style={{
        fontSize: 11,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'var(--csq-muted)',
        fontWeight: 700,
      }}
    >
      Reference data
    </div>
    <h1 style={{ margin: '6px 0 10px', fontSize: 22, fontWeight: 800 }}>Airports</h1>
    <p style={{ color: 'var(--csq-muted)', maxWidth: '60ch', lineHeight: 1.6 }}>
      Airport master data with bulk upload. Not yet connected to the reference-data API.
    </p>
  </div>
);

export default AirportsPage;
