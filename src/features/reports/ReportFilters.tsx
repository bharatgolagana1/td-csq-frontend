import { type ReactNode } from 'react';

import { cycleSelectOptions, type ReportSelection, type ScopeOption, SURVEY_TYPE_LABELS } from '@/api/reports';
import { type CycleOption, type SurveyType } from '@/api/reports.types';
import { Segmented } from '@/design/charts';
import { Select, Toolbar } from '@/design/primitives';

import styles from './reports.module.css';

export type ScopeSelectProps = {
  label: string;
  options: ScopeOption[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
};

export type ReportFiltersProps = {
  /** Operator / airport picker for the users who may choose. */
  scope?: ScopeSelectProps;
  cycles: CycleOption[];
  cyclesLoading: boolean;
  selection: ReportSelection;
  onCycle: (cycleId: string) => void;
  onSurveyType: (surveyType: SurveyType) => void;
  /** Extra controls after the cycle (the comparison's second cycle). */
  children?: ReactNode;
  cycleLabel?: string;
};

/** One filter row above everything it scopes (dataviz: filters never live inside a chart card). */
export function ReportFilters({ scope, cycles, cyclesLoading, selection, onCycle, onSurveyType, children, cycleLabel = 'Cycle' }: ReportFiltersProps) {
  const cycleOptions = cycleSelectOptions(cycles);
  return (
    <Toolbar className={styles.filters}>
      {scope ? (
        <Select
          aria-label={scope.label}
          size="sm"
          wrapperClassName={styles.filterScope}
          options={scope.options}
          value={scope.value}
          placeholder={scope.loading ? 'Loading…' : scope.options.length === 0 ? `No ${scope.label.toLowerCase()} available` : undefined}
          disabled={scope.loading || scope.options.length === 0}
          onChange={(e) => scope.onChange(e.target.value)}
        />
      ) : null}
      <Select
        aria-label={cycleLabel}
        size="sm"
        wrapperClassName={styles.filterSelect}
        options={cycleOptions}
        value={selection.cycle?.id ?? ''}
        placeholder={cyclesLoading ? 'Loading cycles…' : cycleOptions.length === 0 ? 'No cycle yet' : undefined}
        disabled={cyclesLoading || cycleOptions.length === 0}
        onChange={(e) => onCycle(e.target.value)}
      />
      {children}
      {selection.surveyTypes.length > 1 && selection.surveyType ? (
        <Segmented aria-label="Survey type" value={selection.surveyType} onChange={onSurveyType} options={selection.surveyTypes.map((t) => ({ value: t, label: SURVEY_TYPE_LABELS[t] }))} />
      ) : null}
    </Toolbar>
  );
}
