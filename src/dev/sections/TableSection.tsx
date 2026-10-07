import { useMemo, useState } from 'react';

import { Icon } from '@/design/icons';
import { Button, type Column, EmptyState, Pill, RatingPill, type SortState, statusVariant, Switch, Table } from '@/design/primitives';
import { formatRating, humanise } from '@/lib/format';

import { Row, Section } from '../Section';

type Operator = { id: string; name: string; airport: string; share: number; rating: number | null; status: string; selected: number; required: number };

const ROWS: Operator[] = [
  { id: '1', name: 'Cargo Service Center', airport: 'DEL', share: 55, rating: 4.2, status: 'LOCKED', selected: 50, required: 50 },
  { id: '2', name: 'Çelebi Delhi Cargo', airport: 'DEL', share: 45, rating: 3.8, status: 'IN_PROGRESS', selected: 43, required: 50 },
  { id: '3', name: 'Mumbai Cargo Terminal', airport: 'BOM', share: 100, rating: 4.9, status: 'LOCKED', selected: 60, required: 50 },
  { id: '4', name: 'Bangalore Air Cargo', airport: 'BLR', share: 62, rating: 2.4, status: 'NOT_STARTED', selected: 0, required: 40 },
  { id: '5', name: 'Menzies Aviation BLR', airport: 'BLR', share: 38, rating: null, status: 'UNLOCKED', selected: 12, required: 40 },
];

export function TableSection() {
  const [sort, setSort] = useState<SortState>({ id: 'name', dir: 'asc' });
  const [selected, setSelected] = useState<Set<string>>(new Set(['2']));
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const rows = useMemo(() => {
    const list = [...ROWS].sort((a, b) => {
      const av = a[sort.id as keyof Operator] ?? '';
      const bv = b[sort.id as keyof Operator] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return empty ? [] : list;
  }, [sort, empty]);

  const columns: Column<Operator>[] = [
    { id: 'name', header: 'Operator', sortable: true, cell: (r) => <strong>{r.name}</strong> },
    { id: 'airport', header: 'Airport', width: 90, mono: true, sortable: true, cell: (r) => r.airport },
    { id: 'share', header: 'Share', width: 90, align: 'right', mono: true, sortable: true, cell: (r) => `${r.share.toFixed(1)} %` },
    { id: 'rating', header: 'Rating', width: 90, align: 'right', mono: true, sortable: true, cell: (r) => formatRating(r.rating) },
    { id: 'band', header: 'Band', width: 120, hideBelow: 'sm', cell: (r) => <RatingPill rating={r.rating} size="sm" /> },
    { id: 'selected', header: 'Sample', width: 110, align: 'right', mono: true, cell: (r) => `${r.selected} / ${r.required}` },
    { id: 'status', header: 'Sampling', width: 130, cell: (r) => <Pill variant={statusVariant(r.status)} size="sm">{humanise(r.status)}</Pill> },
  ];

  return (
    <Section id="table" title="Table" note="Sticky header, 44px rows, right-aligned numbers, sortable headers (aria-sort), selection column, row actions on hover and keyboard, loading and empty states.">
      <Row>
        <Switch checked={loading} onChange={setLoading} label="Loading" size="sm" />
        <Switch checked={empty} onChange={setEmpty} label="Empty" size="sm" />
        <span style={{ color: 'var(--muted)', fontSize: 13 }} className="num">
          {selected.size} selected
        </span>
      </Row>
      <div style={{ maxHeight: 320 }}>
        <Table
          caption="Operators in cycle"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          sort={sort}
          onSortChange={setSort}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          loading={loading}
          rowActions={(r) => [
            { id: 'open', label: 'Open operator', icon: <Icon name="external" size={16} />, onSelect: () => undefined },
            { id: 'remind', label: 'Send reminder', icon: <Icon name="mail" size={16} />, onSelect: () => undefined, disabled: r.status === 'LOCKED' },
            { id: 'sep', separator: true },
            { id: 'unlock', label: 'Unlock sample', icon: <Icon name="unlock" size={16} />, danger: true, onSelect: () => undefined },
          ]}
          empty={<EmptyState icon="building" title="No operators in this cycle" description="Add participating operators in the cycle builder." action={<Button variant="primary">Edit participants</Button>} />}
        />
      </div>
    </Section>
  );
}
