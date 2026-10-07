import styles from '../gallery.module.css';
import { Section, Sub } from '../Section';

const SWATCHES: [string, string][] = [
  ['--bg', 'Page'],
  ['--surface', 'Surface'],
  ['--surface-2', 'Surface 2'],
  ['--ink', 'Ink'],
  ['--ink-2', 'Ink 2'],
  ['--muted', 'Muted'],
  ['--line', 'Line'],
  ['--line-2', 'Line 2'],
  ['--accent', 'Accent'],
];
const RAMP: [string, string][] = [
  ['--r5', 'Excellent'],
  ['--r4', 'Very good'],
  ['--r3', 'Good'],
  ['--r2', 'Fair'],
  ['--r1', 'Poor'],
  ['--na', 'NA'],
];
const SEMANTIC: [string, string][] = [
  ['--up', 'Up'],
  ['--down', 'Down'],
  ['--warn', 'Warn'],
  ['--danger', 'Danger'],
  ['--info', 'Info'],
];

function Swatches({ items }: { items: [string, string][] }) {
  return (
    <div className={styles.swatches}>
      {items.map(([v, label]) => (
        <div key={v} className={styles.swatch}>
          <div className={styles.swatchColor} style={{ background: `var(${v})` }} />
          <span className={styles.swatchName}>{v}</span>
          <span className={styles.swatchLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function TokensSection() {
  return (
    <Section id="tokens" title="Tokens & type" note="design/tokens.css — light and dark; the rating ramp is the only colour that carries meaning.">
      <Sub>Surfaces and ink</Sub>
      <Swatches items={SWATCHES} />
      <Sub>ACFI rating ramp</Sub>
      <Swatches items={RAMP} />
      <Sub>Semantic</Sub>
      <Swatches items={SEMANTIC} />
      <Sub>Type</Sub>
      <div className={styles.type}>
        <h1>Cargo Service Quality — Archivo 110 wdth / 700</h1>
        <p className={styles.typeMeta}>h1 · 26px · letter-spacing −1.5 %</p>
        <h2 className={styles.typeSample}>Delhi · CSQ 2026 H2 · Sampling open</h2>
        <p className={styles.typeMeta}>h2 · 20px</p>
        <p className={styles.typeSample}>
          Body is Lato 15/22. The operator selects at least the minimum sample, locks it, and the system activates the assessment at midnight on the start date. Dense but calm.
        </p>
        <p className={styles.typeMeta}>body · Lato 400 · 15/22</p>
        <p className={styles.typeSample}>
          <span className="num" style={{ fontSize: 26 }}>
            4.15
          </span>{' '}
          <span className="num">rank 3 / 12 · 43 / 50 · 2026-11-03T09:30 · req_01HZX</span>
        </p>
        <p className={styles.typeMeta}>numbers and codes · IBM Plex Mono · tabular figures</p>
      </div>
    </Section>
  );
}
