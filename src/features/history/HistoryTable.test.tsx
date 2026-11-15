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
  lastSavedAt: '2026-10-05T06:30:00.000Z',
  submittedAt: '2026-10-05T06:34:00.000Z',
  importScore: null,
  exportScore: null,
} as const;

const CUSTOMER: HistoryRow = { ...BASE, id: 'a1', kind: 'CUSTOMER', customerType: 'FF', assessorName: null, assessorEmailMasked: null, assessor: { name: null, email: null, revealed: false }, score: null };
const SELF: HistoryRow = { ...BASE, id: 'a2', kind: 'SELF', customerType: null, assessorName: 'Priya Natarajan', assessorEmailMasked: 'p***@csc.example', assessor: { name: 'Priya Natarajan', email: 'priya@csc.example', revealed: true }, score: 3.5 };

function mount(props: Partial<HistoryTableProps>) {
  const onOpen = vi.fn();
  render(<HistoryTable rows={[CUSTOMER, SELF]} loading={false} sort={{ id: 'submittedAt', dir: 'desc' }} onSortChange={vi.fn()} onOpen={onOpen} canViewScores canViewDetails tzOf={() => 'Asia/Kolkata'} filtered={false} onClearFilters={vi.fn()} {...props} />);
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

  it('each card names its survey, and a draft card says when it was last saved', () => {
    const draft: HistoryRow = { ...SELF, id: 'a3', surveyType: 'INTERNATIONAL', status: 'DRAFT', submittedAt: null, lastSavedAt: '2026-10-04T05:00:00.000Z', progress: { answered: 9, total: 23, pct: 39 } };
    mount({ rows: [CUSTOMER, draft] });
    const [customer, self] = within(screen.getByRole('list', { name: 'Assessments' })).getAllByRole('listitem') as [HTMLElement, HTMLElement];
    expect(within(customer).getByText('Domestic')).toBeInTheDocument();
    expect(within(customer).getByText('Submitted 5 Oct 2026, 12:04 IST')).toBeInTheDocument();
    expect(within(self).getByText('International')).toBeInTheDocument();
    expect(within(self).getByText('Last saved 4 Oct 2026, 10:30 IST · 9 of 23 answered')).toBeInTheDocument();
    // A draft has no score yet: a dash, never the running mean.
    expect(within(self).getByTitle('No score until submitted')).toHaveTextContent('—');
    expect(within(self).queryByText('3.5')).toBeNull();
  });

  it('an IMPORT_EXPORT draft card shows a dash, not its import and export means', () => {
    const draft: HistoryRow = { ...CUSTOMER, id: 'a4', answerMode: 'IMPORT_EXPORT', status: 'DRAFT', submittedAt: null, importScore: 4.2, exportScore: 3.8 };
    mount({ rows: [draft] });
    const [card] = within(screen.getByRole('list', { name: 'Assessments' })).getAllByRole('listitem') as [HTMLElement];
    expect(within(card).getByTitle('No score until submitted')).toBeInTheDocument();
    expect(within(card).queryByText('4.2')).toBeNull();
    expect(within(card).queryByText('Import')).toBeNull();
  });
});
