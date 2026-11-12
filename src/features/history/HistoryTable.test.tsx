import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { type HistoryRow } from '@/api/assessments.types';

// The phone layout (cards under 760px); the table layout is covered through HistoryPage.
vi.mock('./useMediaQuery', () => ({ useMediaQuery: () => true }));

import { HistoryTable, type HistoryTableProps } from './HistoryTable';

const BASE = {
  cycle: { id: 'cy1', code: 'CSQ-26H2', name: 'CSQ 2026 H2' },
  operator: { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center' },
  surveyType: 'DOMESTIC',
  customerId: null,
  status: 'SUBMITTED',
  progress: { answered: 23, total: 23, pct: 100 },
  startedAt: '2026-10-02T04:00:00.000Z',
  submittedAt: '2026-10-05T06:34:00.000Z',
  importScore: null,
  exportScore: null,
} as const;

const CUSTOMER: HistoryRow = { ...BASE, id: 'a1', kind: 'CUSTOMER', customerType: 'FF', assessorName: null, assessorEmailMasked: null, assessor: { name: null, email: null, revealed: false }, score: null };
const SELF: HistoryRow = { ...BASE, id: 'a2', kind: 'SELF', customerType: null, assessorName: 'Priya Natarajan', assessorEmailMasked: 'p***@csc.example', assessor: { name: 'Priya Natarajan', email: 'priya@csc.example', revealed: true }, score: 3.5 };

function mount(props: Partial<HistoryTableProps>) {
  const onOpen = vi.fn();
  render(<HistoryTable rows={[CUSTOMER, SELF]} loading={false} sort={{ id: 'startedAt', dir: 'desc' }} onSortChange={vi.fn()} onOpen={onOpen} canViewScores canViewDetails tzOf={() => 'Asia/Kolkata'} filtered={false} onClearFilters={vi.fn()} {...props} />);
  return onOpen;
}

describe('HistoryTable cards', () => {
  it('every card opens its return with assessments.details', async () => {
    const onOpen = mount({});
    const cards = within(screen.getByRole('list', { name: 'Assessments' })).getAllByRole('button');
    expect(cards).toHaveLength(2);
    await userEvent.click(within(screen.getByRole('list', { name: 'Assessments' })).getByRole('button', { name: /Identity hidden/ }));
    expect(onOpen).toHaveBeenCalledWith(CUSTOMER);
  });

  it('without assessments.details a customer card is not a button; the self-assessment card still opens', async () => {
    const onOpen = mount({ canViewDetails: false });
    const list = screen.getByRole('list', { name: 'Assessments' });
    expect(within(list).getAllByRole('button')).toHaveLength(1);
    expect(within(list).queryByRole('button', { name: /Identity hidden/ })).toBeNull();
    await userEvent.click(within(list).getByText('Identity hidden'));
    expect(onOpen).not.toHaveBeenCalled();
    await userEvent.click(within(list).getByRole('button', { name: /Priya Natarajan/ }));
    expect(onOpen).toHaveBeenCalledWith(SELF);
  });

  it('without assessments.scores a customer card shows its score as hidden, the self-assessment card its score', () => {
    mount({ canViewScores: false });
    const [customer, self] = within(screen.getByRole('list', { name: 'Assessments' })).getAllByRole('listitem') as [HTMLElement, HTMLElement];
    expect(within(customer).getByTitle('Score hidden')).toHaveTextContent('—');
    expect(within(self).getByText('3.5')).toBeInTheDocument();
    expect(within(self).queryByText('Score hidden')).toBeNull();
  });
});
