import { Icon } from '@/design/icons';

import { type WeightSummary } from './surveyRules';
import styles from './surveys.module.css';

/** The live 100 % guard under a weight field: what the siblings total with the value being typed. */
export function WeightGuard({ summary, what }: { summary: WeightSummary; what: 'categories' | 'questions' }) {
  if (summary.count === 0) return null;
  const text =
    summary.state === 'unweighted'
      ? `No weights set — ${what} count equally.`
      : summary.state === 'ok'
        ? `${what === 'categories' ? 'Category' : 'Question'} weights total 100 %.`
        : summary.state === 'off'
          ? `${what === 'categories' ? 'Category' : 'Question'} weights total ${summary.total} % — they must total 100 % to publish.`
          : `Weights are set on some ${what} but not on ${summary.missing.join(', ')} — set every one or none.`;
  const warn = summary.state === 'off' || summary.state === 'partial';
  return (
    <p className={styles.guard} data-state={summary.state} role={warn ? 'status' : undefined}>
      <Icon name={warn ? 'warning' : summary.state === 'ok' ? 'check' : 'info'} size={16} aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}
