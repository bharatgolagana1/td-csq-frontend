import { cycleSelectOptions, SURVEY_TYPE_LABELS } from '@/api/reports';
import { Segmented } from '@/design/charts';
import { Select } from '@/design/primitives';
import { cn } from '@/lib/cn';

import styles from './dashboard.module.css';
import { type DashboardSelection } from './useDashboardSelection';

/**
 * The dark context strip above the cards: programme and scope on the left, the
 * operator (platform / airport users), cycle and survey type as pills on the right.
 * One filter row above everything it scopes.
 */
export function DashboardFilters({ selection }: { selection: DashboardSelection }) {
  const { scope, cycles, cyclesLoading, selection: sel, setCycle, setSurveyType } = selection;
  const cycleOptions = cycleSelectOptions(cycles);
  return (
    <div className={cn(styles.strip, styles.inverse)} role="region" aria-label="Dashboard scope">
      <p className={styles.stripTitle}>
        <span className={styles.stripBrand}>Cargo Service Quality</span>
        <span className={styles.stripSep} aria-hidden="true">
          ·
        </span>
        <span className={styles.stripScope}>Pan-India</span>
      </p>
      <div className={styles.stripControls}>
        {scope.canChoose ? (
          <Select
            aria-label="Operator"
            size="sm"
            wrapperClassName={cn(styles.pillSelect, styles.pillOperator)}
            options={scope.options}
            value={scope.acoId}
            placeholder={scope.loading ? 'Loading operators…' : scope.options.length === 0 ? 'No active operators' : undefined}
            disabled={scope.loading || scope.options.length === 0}
            onChange={(e) => scope.setAcoId(e.target.value)}
          />
        ) : null}
        <Select
          aria-label="Cycle"
          size="sm"
          wrapperClassName={styles.pillSelect}
          options={cycleOptions}
          value={sel.cycle?.id ?? ''}
          placeholder={cyclesLoading ? 'Loading cycles…' : cycleOptions.length === 0 ? 'No cycle yet' : undefined}
          disabled={cyclesLoading || cycleOptions.length === 0}
          onChange={(e) => setCycle(e.target.value)}
        />
        {sel.surveyTypes.length > 1 && sel.surveyType ? (
          <Segmented aria-label="Survey type" tone="inverse" value={sel.surveyType} onChange={setSurveyType} options={sel.surveyTypes.map((t) => ({ value: t, label: SURVEY_TYPE_LABELS[t] }))} />
        ) : null}
      </div>
    </div>
  );
}
