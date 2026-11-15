import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnswerSummary } from './AnswerSummary';
import { groupsFromForm } from './rules';
import { answer, COMPLETE, FORM, REMARKS } from './testFixtures';

/** The read-only row of a question, found by its text. */
function row(text: string): HTMLElement {
  return screen.getByText(text).closest('li') as HTMLElement;
}

describe('AnswerSummary', () => {
  it('IMPORT_EXPORT: one row per question with both ratings, follow-ups only where given, and no comment lines', () => {
    const answers = [
      answer('q1', { direction: 'IMPORT', rating: 4 }),
      // An export answer saved with a comment before the form stopped taking them: not shown.
      answer('q1', { direction: 'EXPORT', rating: 2, comment: 'Typed before comments went', followUp: ['Queues', 'Staff'] }),
      answer('q2', { direction: 'IMPORT', rating: null, na: true }),
      answer('q3', { direction: 'IMPORT', rating: 5 }),
      answer('q3', { direction: 'EXPORT', rating: 3 }),
    ];
    render(<AnswerSummary groups={groupsFromForm(FORM, answers, 'IMPORT_EXPORT', REMARKS)} answerMode="IMPORT_EXPORT" />);

    const q1 = row('How would you rate shipment acceptance?');
    expect(within(q1).getByRole('group', { name: 'Import answer' })).toHaveTextContent('ImportVery good');
    expect(within(q1).getByRole('group', { name: 'Export answer' })).toHaveTextContent('ExportFair');
    expect(within(q1).getByRole('group', { name: 'Export follow-up' })).toHaveTextContent('ExportQueuesStaff');
    expect(within(q1).queryByRole('group', { name: 'Import follow-up' })).toBeNull();
    expect(screen.queryByText('Typed before comments went')).toBeNull();
    expect(document.querySelector('blockquote')).toBeNull();

    const q2 = row('How would you rate documentation handling?');
    expect(within(q2).getByRole('group', { name: 'Import answer' })).toHaveTextContent('NA');
    expect(within(q2).getByRole('group', { name: 'Export answer' })).toHaveTextContent('Not answered');
    expect(within(q2).queryByRole('group', { name: /follow-up/ })).toBeNull();

    // Answered slots over both directions, per section; then the section's remark.
    const handling = screen.getByRole('region', { name: 'Cargo handling' });
    expect(within(handling).getByText('3/4')).toBeInTheDocument();
    expect(within(handling).getByText('Acceptance is quick; paperwork could be lighter.')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Security' })).getByText('2/4')).toBeInTheDocument();
  });

  it('SINGLE: one rating per question with its follow-ups and comment, unchanged', () => {
    const answers = [answer('q1', { rating: 2, comment: 'Slow at the gate', followUp: ['Queues'] }), ...COMPLETE.slice(1)];
    render(<AnswerSummary groups={groupsFromForm(FORM, answers, 'SINGLE', REMARKS)} />);
    const q1 = row('How would you rate shipment acceptance?');
    expect(within(q1).getByText('Fair')).toBeInTheDocument();
    expect(within(q1).getByText('Queues')).toBeInTheDocument();
    expect(within(q1).getByText('Slow at the gate').tagName).toBe('BLOCKQUOTE');
    expect(screen.queryByRole('group', { name: /answer$/ })).toBeNull();
    // The question code is a tooltip on the text, not part of the return; the subcategory stays.
    expect(within(q1).queryByText('Q1')).toBeNull();
    expect(screen.getByText('How would you rate shipment acceptance?')).toHaveAttribute('title', 'Q1');
    expect(within(q1).getByText('Shipment acceptance')).toBeInTheDocument();
  });
});
