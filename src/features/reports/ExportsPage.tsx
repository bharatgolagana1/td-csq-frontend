import { useMemo, useState } from 'react';

import { SURVEY_TYPE_LABELS, useAirportScope, useCycleSelection, useOperatorScope } from '@/api/reports';
import { type ExportScope } from '@/api/reports.types';
import { useSession } from '@/auth/session';
import { Card, KeyValue, PageHeader, Select } from '@/design/primitives';

import { ExportButton } from './ExportButton';
import { ReportFilters } from './ReportFilters';
import styles from './reports.module.css';

const SCOPE_LABELS: Record<ExportScope, string> = { operator: 'Operator report', airport: 'Airport report', national: 'National report' };

/** Reports → Exports: the operator, airport or national report as CSV (`GET /reports/export`). */
export default function ExportsPage() {
  const { hasTask } = useSession();
  const scopes = useMemo(
    () => (['operator', 'airport', 'national'] as const).filter((s) => hasTask(s === 'operator' ? 'reports.operator' : s === 'airport' ? 'reports.airport' : 'reports.national')),
    [hasTask],
  );
  const [scope, setScope] = useState<ExportScope | ''>('');
  const effectiveScope: ExportScope | undefined = scope || scopes[0];
  const cycle = useCycleSelection();
  const operator = useOperatorScope();
  const airport = useAirportScope();

  const target = effectiveScope === 'operator' ? operator.options.find((o) => o.value === operator.acoId)?.label : effectiveScope === 'airport' ? airport.options.find((a) => a.value === airport.airportId)?.label : undefined;
  const query = {
    scope: effectiveScope ?? 'national',
    ...cycle.query,
    ...(effectiveScope === 'operator' ? { acoId: operator.acoId } : {}),
    ...(effectiveScope === 'airport' ? { airportId: airport.airportId } : {}),
  };
  const ready = Boolean(effectiveScope) && cycle.ready && (effectiveScope !== 'operator' || Boolean(operator.acoId)) && (effectiveScope !== 'airport' || Boolean(airport.airportId));

  return (
    <>
      <PageHeader eyebrow="Reports" title="Exports" context="Every level of a report as a CSV file: overall, categories, subcategories and questions." />
      <ReportFilters
        scope={
          effectiveScope === 'operator' && operator.canChoose
            ? { label: 'Operator', options: operator.options, value: operator.acoId, onChange: operator.setAcoId, loading: operator.loading }
            : effectiveScope === 'airport' && airport.canChoose
              ? { label: 'Airport', options: airport.options, value: airport.airportId, onChange: airport.setAirportId, loading: airport.loading }
              : undefined
        }
        cycles={cycle.cycles}
        cyclesLoading={cycle.cyclesLoading}
        selection={cycle.selection}
        onCycle={cycle.setCycle}
        onSurveyType={cycle.setSurveyType}
      />
      <Card title="Download" subtitle="The file carries the same confidentiality rules as the report on screen.">
        <div className={styles.exportForm}>
          <Select label="Report" options={scopes.map((s) => ({ value: s, label: SCOPE_LABELS[s] }))} value={effectiveScope ?? ''} onChange={(e) => setScope(e.target.value as ExportScope)} disabled={scopes.length <= 1} />
          <KeyValue
            layout="rows"
            columns={1}
            items={[
              { key: 'Scope', value: effectiveScope ? SCOPE_LABELS[effectiveScope] : '—' },
              ...(target ? [{ key: effectiveScope === 'operator' ? 'Operator' : 'Airport', value: target }] : []),
              { key: 'Cycle', value: cycle.selection.cycle?.name ?? '—' },
              { key: 'Survey type', value: cycle.selection.surveyType ? SURVEY_TYPE_LABELS[cycle.selection.surveyType] : '—' },
              { key: 'Format', value: 'CSV (UTF-8)', mono: true },
            ]}
          />
          <div>
            <ExportButton query={query} cycleCode={cycle.selection.cycle?.code} disabled={!ready} variant="primary" label="Download CSV" />
          </div>
        </div>
      </Card>
    </>
  );
}
