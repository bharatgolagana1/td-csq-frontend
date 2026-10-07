import { useMemo, useState } from 'react';

import { type Customer, type CustomerType } from '@/api/customers.types';
import { type CustomerSummary, type EligibleEntry, type SelectionItem, type SelectionRow, type SurveyType } from '@/api/sampling.types';
import { type Column, EmptyState, Pagination, Pill, SearchInput, Select, type SortState, Table, Toolbar, ToolbarCount } from '@/design/primitives';
import { formatDateTime, formatInt } from '@/lib/format';

import styles from './sampling.module.css';
import { SURVEY_TYPE_LABELS, surveyTypeVariant } from './samplingLabels';

/* The eligible table (REQUIREMENTS §13): one row per (customer, survey type),
   so a BOTH customer in a BOTH cycle appears twice. Selected rows that are no
   longer eligible (deactivated after selection) stay visible so they can be removed. */

export type SampleRow = {
  key: string;
  customerId: string;
  surveyType: SurveyType;
  customer: Customer | CustomerSummary | null;
  selected: boolean;
  eligible: boolean;
  addedAt: string | null;
};

export function buildRows(entries: readonly EligibleEntry[], selection: readonly SelectionRow[]): SampleRow[] {
  const selectedByKey = new Map<string, SelectionRow>(selection.filter((r) => r.state !== 'REMOVED').map((r) => [`${r.customerId}:${r.surveyType}`, r]));
  const rows: SampleRow[] = entries.map((e) => {
    const sel = selectedByKey.get(e.key);
    return { key: e.key, customerId: e.customer.id, surveyType: e.surveyType, customer: e.customer, selected: Boolean(sel), eligible: true, addedAt: sel?.addedAt ?? null };
  });
  const present = new Set(rows.map((r) => r.key));
  selection.forEach((r) => {
    if (r.state === 'REMOVED') return;
    const key = `${r.customerId}:${r.surveyType}`;
    if (present.has(key)) return;
    rows.push({ key, customerId: r.customerId, surveyType: r.surveyType, customer: r.customer, selected: true, eligible: false, addedAt: r.addedAt });
  });
  return rows;
}

type View = 'all' | 'selected' | 'unselected';

const VIEW_OPTIONS = [
  { value: 'all', label: 'All eligible' },
  { value: 'selected', label: 'Selected only' },
  { value: 'unselected', label: 'Not selected' },
];
const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'FF', label: 'FF' },
  { value: 'CB', label: 'CB' },
];

function lastSampled(c: Customer | CustomerSummary | null): string {
  if (!c || !('lastSampledCycleId' in c)) return '—';
  if (c.lastSampledCycle) return c.lastSampledCycle.code;
  return c.lastSampledCycleId ? 'Sampled' : 'Never';
}

function compare(a: SampleRow, b: SampleRow, sort: SortState): number {
  const dir = sort.dir === 'asc' ? 1 : -1;
  const av = sort.id === 'type' ? (a.customer?.type ?? '') : sort.id === 'surveyType' ? a.surveyType : sort.id === 'selected' ? (a.selected ? '0' : '1') : (a.customer?.name ?? '');
  const bv = sort.id === 'type' ? (b.customer?.type ?? '') : sort.id === 'surveyType' ? b.surveyType : sort.id === 'selected' ? (b.selected ? '0' : '1') : (b.customer?.name ?? '');
  const primary = av.localeCompare(bv) * dir;
  return primary !== 0 ? primary : (a.customer?.name ?? '').localeCompare(b.customer?.name ?? '');
}

export type EligibleTableProps = {
  rows: SampleRow[];
  loading: boolean;
  /** Checkboxes are shown only while the selection may change and the user may manage. */
  editable: boolean;
  surveyTypes: readonly SurveyType[];
  onChange: (add: SelectionItem[], remove: SelectionItem[]) => void;
  tz: string;
  /** Locked: open on "Selected only". */
  defaultView?: View;
};

export function EligibleTable({ rows, loading, editable, surveyTypes, onChange, tz, defaultView = 'all' }: EligibleTableProps) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<CustomerType | ''>('');
  const [surveyType, setSurveyType] = useState<SurveyType | ''>('');
  const [view, setView] = useState<View>(defaultView);
  const [sort, setSort] = useState<SortState>({ id: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (type && r.customer?.type !== type) return false;
        if (surveyType && r.surveyType !== surveyType) return false;
        if (view === 'selected' && !r.selected) return false;
        if (view === 'unselected' && r.selected) return false;
        if (needle) {
          const hay = `${r.customer?.name ?? ''} ${r.customer?.contactPerson ?? ''} ${r.customer?.email ?? ''}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => compare(a, b, sort));
  }, [rows, q, type, surveyType, view, sort]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedKeys = useMemo(() => new Set(rows.filter((r) => r.selected).map((r) => r.key)), [rows]);
  const anyFilter = Boolean(q || type || surveyType || view !== 'all');
  const resetPage = () => setPage(1);

  const toItem = (r: SampleRow): SelectionItem => ({ customerId: r.customerId, surveyType: r.surveyType });
  const applySelection = (next: Set<string>) => {
    const add = pageRows.filter((r) => next.has(r.key) && !r.selected).map(toItem);
    const remove = pageRows.filter((r) => !next.has(r.key) && r.selected).map(toItem);
    onChange(add, remove);
  };
  const toggle = (r: SampleRow) => (r.selected ? onChange([], [toItem(r)]) : onChange([toItem(r)], []));

  const columns: Column<SampleRow>[] = [
    {
      id: 'name',
      header: 'Customer',
      sortable: true,
      cell: (r) => (
        <span className={styles.customer}>
          <span className={styles.customerName}>{r.customer?.name ?? 'Customer no longer visible'}</span>
          {r.customer && r.customer.contactPerson !== r.customer.name ? <span className={styles.customerContact}>{r.customer.contactPerson}</span> : null}
        </span>
      ),
    },
    { id: 'email', header: 'E-mail', hideBelow: 'md', cell: (r) => <span className={styles.email}>{r.customer?.email ?? '—'}</span> },
    {
      id: 'type',
      header: 'Type',
      width: 80,
      sortable: true,
      hideBelow: 'sm',
      cell: (r) =>
        r.customer ? (
          <Pill variant={r.customer.type === 'FF' ? 'info' : 'neutral'} dot={false} size="sm" title={r.customer.type === 'FF' ? 'Freight forwarder' : 'Customs broker'}>
            {r.customer.type}
          </Pill>
        ) : (
          '—'
        ),
    },
    {
      id: 'surveyType',
      header: 'Survey',
      width: 120,
      sortable: true,
      cell: (r) => (
        <span className={styles.pills}>
          <Pill variant={surveyTypeVariant(r.surveyType)} dot={false} size="sm">
            {SURVEY_TYPE_LABELS[r.surveyType]}
          </Pill>
          {!r.eligible ? (
            <Pill variant="warn" size="sm">
              No longer eligible
            </Pill>
          ) : null}
        </span>
      ),
    },
    { id: 'lastSampled', header: 'Last sampled', width: 130, mono: true, hideBelow: 'md', cell: (r) => <span className={lastSampled(r.customer) === 'Never' ? styles.muted : undefined}>{lastSampled(r.customer)}</span> },
    {
      id: 'selected',
      header: 'Selected',
      width: 170,
      sortable: true,
      mono: true,
      hideBelow: 'md',
      cell: (r) => (r.selected ? (r.addedAt ? formatDateTime(r.addedAt, tz) : 'Yes') : <span className={styles.muted}>—</span>),
    },
  ];

  return (
    <>
      <Toolbar
        end={
          <ToolbarCount>
            {loading ? '…' : `${formatInt(total)} ${total === 1 ? 'entry' : 'entries'}`}
            {!loading && anyFilter ? ` of ${formatInt(rows.length)}` : ''}
          </ToolbarCount>
        }
      >
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            resetPage();
          }}
          debounce={200}
          placeholder="Search name, contact or e-mail"
          label="Search eligible customers"
        />
        <Select
          aria-label="Type"
          size="sm"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => {
            setType(e.target.value as CustomerType | '');
            resetPage();
          }}
        />
        {surveyTypes.length > 1 ? (
          <Select
            aria-label="Survey type"
            size="sm"
            options={[{ value: '', label: 'Both survey types' }, ...surveyTypes.map((s) => ({ value: s, label: SURVEY_TYPE_LABELS[s] }))]}
            value={surveyType}
            onChange={(e) => {
              setSurveyType(e.target.value as SurveyType | '');
              resetPage();
            }}
          />
        ) : null}
        <Select
          aria-label="Show"
          size="sm"
          options={VIEW_OPTIONS}
          value={view}
          onChange={(e) => {
            setView(e.target.value as View);
            resetPage();
          }}
        />
      </Toolbar>

      <Table
        caption="Eligible customers"
        columns={columns}
        rows={pageRows}
        rowKey={(r) => r.key}
        loading={loading}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          resetPage();
        }}
        selectable={editable}
        selected={selectedKeys}
        onSelectedChange={applySelection}
        onRowClick={editable ? toggle : undefined}
        rowClassName={(r) => [r.selected ? styles.rowSelected : '', r.eligible ? '' : styles.rowIneligible].filter(Boolean).join(' ') || undefined}
        empty={
          <EmptyState
            icon="users"
            title={anyFilter ? 'No entries match' : 'No eligible customers'}
            description={anyFilter ? 'Try another search, type, survey type or view.' : 'Only active customers whose survey type matches the cycle can be sampled. Add customers in the directory first.'}
          />
        }
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          resetPage();
        }}
      />
    </>
  );
}
