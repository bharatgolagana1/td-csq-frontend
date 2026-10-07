import { Link } from 'react-router-dom';

import { type Operator } from '@/api/operators.types';
import { type Column, EmptyState, Pill, statusVariant, Table, Tag } from '@/design/primitives';
import { formatInt, formatPct, humanise } from '@/lib/format';

import styles from './airports.module.css';

/** The airport's operators (any status) with their current share; names link to the operator page. */
export function AirportOperatorsTable({ operators }: { operators: Operator[] }) {
  const columns: Column<Operator>[] = [
    { id: 'code', header: 'Code', width: 120, mono: true, cell: (o) => <span className={styles.code}>{o.code}</span> },
    {
      id: 'name',
      header: 'Operator',
      cell: (o) => (
        <Link to={`../../operators/${o.id}`} relative="path" className={styles.nameLink}>
          {o.name}
        </Link>
      ),
    },
    {
      id: 'operations',
      header: 'Operations',
      hideBelow: 'sm',
      cell: (o) => (
        <>
          {o.operations.domestic ? <Tag>Domestic</Tag> : null} {o.operations.international ? <Tag>International</Tag> : null}
          {!o.operations.domestic && !o.operations.international ? <span className={styles.muted}>—</span> : null}
        </>
      ),
    },
    { id: 'status', header: 'Status', width: 110, cell: (o) => <Pill variant={statusVariant(o.status)}>{humanise(o.status)}</Pill> },
    { id: 'members', header: 'Members', width: 100, align: 'right', mono: true, hideBelow: 'md', cell: (o) => formatInt(o.memberCount) },
    { id: 'share', header: 'Share', width: 90, align: 'right', mono: true, cell: (o) => formatPct(o.currentShare) },
  ];
  return (
    <Table
      caption="Operators at this airport"
      columns={columns}
      rows={operators}
      rowKey={(o) => o.id}
      stickyHeader={false}
      empty={<EmptyState icon="building" size="sm" title="No operators yet" description="Operators are tagged to this airport when they are created or approved." />}
    />
  );
}
