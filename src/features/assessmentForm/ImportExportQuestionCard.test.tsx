import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { type AnswerDirection } from '@/api/assessments.types';

import { ImportExportQuestionCard } from './ImportExportQuestionCard';
import { emptyAnswer } from './rules';
import { Q1, Q3 } from './testFixtures';
import { type LocalAnswer } from './types';

function answers(byDirection: Partial<Record<AnswerDirection, LocalAnswer>>) {
  return (direction: AnswerDirection) => byDirection[direction];
}

function rated(questionId: string, direction: AnswerDirection, rating: LocalAnswer['rating'], followUp: string[] = []): LocalAnswer {
  return { ...emptyAnswer(questionId, direction), rating, followUp };
}

const rows = () => ({ importRow: screen.getByRole('group', { name: 'Import' }), exportRow: screen.getByRole('group', { name: 'Export' }) });

describe('ImportExportQuestionCard', () => {
  it('asks the question once, then an Import and an Export rating row, each a full rating group named by question and direction', async () => {
    const onChange = vi.fn();
    render(<ImportExportQuestionCard question={Q1} index={7} section="Shipment acceptance" answerFor={answers({})} onChange={onChange} />);
    expect(screen.getAllByRole('heading')).toEqual([screen.getByRole('heading', { level: 3, name: Q1.text })]);
    expect(screen.getByText('Q7')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: Q1.text })).toHaveAttribute('id', 'q-q1');

    const { importRow, exportRow } = rows();
    expect(importRow).toHaveAttribute('id', 'q-q1-import');
    expect(exportRow).toHaveAttribute('id', 'q-q1-export');
    const importScale = within(importRow).getByRole('radiogroup', { name: `${Q1.text} — Import` });
    const exportScale = within(exportRow).getByRole('radiogroup', { name: `${Q1.text} — Export` });
    // 5 points + NA each; the cells show short labels, the radios keep the full ones.
    expect(within(importScale).getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual(['5', '4', '3', '2', '1', 'NA']);
    expect(within(exportScale).getAllByRole('radio')).toHaveLength(6);
    expect(within(importScale).getByText('V. good')).toBeInTheDocument();
    expect(within(importScale).getByRole('radio', { name: 'Very good' })).toBeInTheDocument();

    await userEvent.click(within(importRow).getByRole('radio', { name: 'Excellent' }));
    expect(onChange).toHaveBeenLastCalledWith('IMPORT', { rating: 5, na: false });
    await userEvent.click(within(exportRow).getByRole('radio', { name: 'Not applicable' }));
    expect(onChange).toHaveBeenLastCalledWith('EXPORT', { na: true, rating: null });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('takes no comment, whatever the comment mode and the rating', () => {
    // Q3 requires a comment and Q1 asks for one on Fair / Poor on a single-answer form.
    const { unmount } = render(<ImportExportQuestionCard question={Q3} index={3} answerFor={answers({ IMPORT: rated('q3', 'IMPORT', 2), EXPORT: rated('q3', 'EXPORT', 1) })} onChange={vi.fn()} showValidation />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByText(/comment/i)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    unmount();
    render(<ImportExportQuestionCard question={Q1} index={1} answerFor={answers({ IMPORT: rated('q1', 'IMPORT', 1), EXPORT: rated('q1', 'EXPORT', 2) })} onChange={vi.fn()} showValidation />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('validates each direction on its own: only the unrated one says so, linked to its group', () => {
    const { rerender } = render(<ImportExportQuestionCard question={Q3} index={3} answerFor={answers({ IMPORT: rated('q3', 'IMPORT', 5) })} onChange={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<ImportExportQuestionCard question={Q3} index={3} answerFor={answers({ IMPORT: rated('q3', 'IMPORT', 5) })} onChange={vi.fn()} showValidation />);
    const { importRow, exportRow } = rows();
    expect(within(importRow).queryByRole('alert')).toBeNull();
    expect(within(importRow).getByRole('radiogroup')).not.toHaveAttribute('aria-invalid');
    expect(within(exportRow).getAllByRole('alert').map((a) => a.textContent)).toEqual(['Choose a rating or NA']);
    const exportScale = within(exportRow).getByRole('radiogroup');
    expect(exportScale).toHaveAttribute('aria-invalid', 'true');
    expect(exportScale).toHaveAccessibleDescription('Choose a rating or NA');
  });

  it('opens the follow-up only under a direction rated Fair or Poor, and sends that direction’s choice', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<ImportExportQuestionCard question={Q1} index={1} answerFor={answers({ IMPORT: rated('q1', 'IMPORT', 4), EXPORT: rated('q1', 'EXPORT', 2) })} onChange={onChange} />);
    let { importRow, exportRow } = rows();
    expect(within(importRow).queryByRole('group', { name: 'What went wrong?' })).toBeNull();
    const followUp = within(exportRow).getByRole('group', { name: 'What went wrong?' });
    expect(within(followUp).getAllByRole('checkbox').map((c) => c.closest('label')?.textContent)).toEqual(['Queues', 'Paperwork', 'Staff']);

    await userEvent.click(within(exportRow).getByRole('checkbox', { name: 'Staff' }));
    expect(onChange).toHaveBeenLastCalledWith('EXPORT', { followUp: ['Staff'] });

    // Import rated Poor too: its own follow-up opens, with its own choice.
    rerender(<ImportExportQuestionCard question={Q1} index={1} answerFor={answers({ IMPORT: rated('q1', 'IMPORT', 1, ['Queues']), EXPORT: rated('q1', 'EXPORT', 2, ['Staff']) })} onChange={onChange} />);
    ({ importRow, exportRow } = rows());
    expect(within(importRow).getByRole('checkbox', { name: 'Queues' })).toBeChecked();
    expect(within(importRow).getByRole('checkbox', { name: 'Staff' })).not.toBeChecked();
    expect(within(exportRow).getByRole('checkbox', { name: 'Staff' })).toBeChecked();
    await userEvent.click(within(importRow).getByRole('checkbox', { name: 'Paperwork' }));
    expect(onChange).toHaveBeenLastCalledWith('IMPORT', { followUp: ['Queues', 'Paperwork'] });

    // Back to Good: the follow-up closes again.
    rerender(<ImportExportQuestionCard question={Q1} index={1} answerFor={answers({ IMPORT: rated('q1', 'IMPORT', 3, ['Queues']), EXPORT: rated('q1', 'EXPORT', 2) })} onChange={onChange} />);
    expect(within(rows().importRow).queryByRole('group', { name: 'What went wrong?' })).toBeNull();
  });

  it('disables both directions when read-only', async () => {
    const onChange = vi.fn();
    render(<ImportExportQuestionCard question={Q1} index={3} answerFor={answers({ IMPORT: rated('q1', 'IMPORT', 3), EXPORT: rated('q1', 'EXPORT', 1, ['Queues']) })} onChange={onChange} readOnly />);
    const { importRow, exportRow } = rows();
    expect(within(importRow).getByRole('radio', { name: 'Good' })).toBeChecked();
    expect(within(exportRow).getByRole('radio', { name: 'Poor' })).toBeChecked();
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
    expect(within(exportRow).getByRole('checkbox', { name: 'Queues' })).toBeDisabled();
    await userEvent.click(within(importRow).getByRole('radio', { name: 'Poor' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
