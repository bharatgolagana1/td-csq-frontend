import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { type Column, type SortState, Table, toggleSort } from './Table';

type Row = { id: string; name: string; score: number };

const ROWS: Row[] = [
  { id: 'a', name: 'Alpha', score: 4.2 },
  { id: 'b', name: 'Beta', score: 3.8 },
  { id: 'c', name: 'Gamma', score: 4.9 },
];

const COLUMNS: Column<Row>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, sortable: true },
  { id: 'score', header: 'Score', cell: (r) => r.score.toFixed(1), align: 'right', mono: true, sortable: true },
];

function SortHarness({ onSort }: { onSort: (s: SortState) => void }) {
  const [sort, setSort] = useState<SortState | undefined>(undefined);
  return (
    <Table
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(r) => r.id}
      sort={sort}
      onSortChange={(s) => {
        setSort(s);
        onSort(s);
      }}
    />
  );
}

describe('Table', () => {
  it('toggles sort direction and exposes aria-sort', async () => {
    const onSort = vi.fn();
    render(<SortHarness onSort={onSort} />);
    const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    await userEvent.click(within(nameHeader).getByRole('button'));
    expect(onSort).toHaveBeenLastCalledWith({ id: 'name', dir: 'asc' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(within(nameHeader).getByRole('button'));
    expect(onSort).toHaveBeenLastCalledWith({ id: 'name', dir: 'desc' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    expect(toggleSort({ id: 'name', dir: 'desc' }, 'score')).toEqual({ id: 'score', dir: 'asc' });
  });

  it('selects rows individually and all at once', async () => {
    const onSelectedChange = vi.fn();
    const { rerender } = render(<Table columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} selectable selected={new Set()} onSelectedChange={onSelectedChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 2' }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(new Set(['b']));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(new Set(['a', 'b', 'c']));

    rerender(<Table columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} selectable selected={new Set(['a'])} onSelectedChange={onSelectedChange} />);
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toHaveProperty('indeterminate', true);
  });

  it('renders row actions, the empty state and the loading state', async () => {
    const edit = vi.fn();
    render(<Table columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} rowActions={(r) => [{ id: 'edit', label: `Edit ${r.name}`, onSelect: edit }]} />);
    const buttons = screen.getAllByRole('button', { name: 'Row actions' });
    expect(buttons).toHaveLength(3);
    await userEvent.click(buttons[0] as HTMLElement);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit Alpha' }));
    expect(edit).toHaveBeenCalled();

    render(<Table columns={COLUMNS} rows={[]} rowKey={(r) => r.id} empty={<p>No operators yet</p>} />);
    expect(screen.getByText('No operators yet')).toBeInTheDocument();

    render(<Table columns={COLUMNS} rows={[]} rowKey={(r) => r.id} loading skeletonRows={3} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });
});
