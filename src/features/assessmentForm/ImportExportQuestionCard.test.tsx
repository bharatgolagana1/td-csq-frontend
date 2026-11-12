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

describe('ImportExportQuestionCard', () => {
  it('asks the question once and rates import and export separately, each group named by question and direction', async () => {
    const onChange = vi.fn();
    render(<ImportExportQuestionCard question={Q1} index={7} section="Shipment acceptance" answerFor={answers({})} onChange={onChange} />);
    expect(screen.getByRole('heading', { level: 3, name: Q1.text })).toBeInTheDocument();
    expect(screen.getByText('Q7')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: Q1.text })).toHaveAttribute('id', 'q-q1');

    const importPart = screen.getByRole('region', { name: 'Import' });
    const exportPart = screen.getByRole('region', { name: 'Export' });
    expect(importPart).toHaveAttribute('id', 'q-q1-import');
    expect(exportPart).toHaveAttribute('id', 'q-q1-export');
    expect(within(importPart).getByRole('radiogroup', { name: `${Q1.text} — Import` })).toBeInTheDocument();
    expect(within(exportPart).getByRole('radiogroup', { name: `${Q1.text} — Export` })).toBeInTheDocument();

    await userEvent.click(within(importPart).getByRole('radio', { name: 'Excellent' }));
    expect(onChange).toHaveBeenLastCalledWith('IMPORT', { rating: 5, na: false });
    await userEvent.click(within(exportPart).getByRole('radio', { name: 'Not applicable' }));
    expect(onChange).toHaveBeenLastCalledWith('EXPORT', { na: true, rating: null });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('validates each direction on its own', () => {
    const { rerender } = render(<ImportExportQuestionCard question={Q3} index={3} answerFor={answers({ IMPORT: { ...emptyAnswer('q3', 'IMPORT'), rating: 5, comment: 'Fine' } })} onChange={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<ImportExportQuestionCard question={Q3} index={3} answerFor={answers({ IMPORT: { ...emptyAnswer('q3', 'IMPORT'), rating: 5, comment: 'Fine' } })} onChange={vi.fn()} showValidation />);
    const importPart = screen.getByRole('region', { name: 'Import' });
    const exportPart = screen.getByRole('region', { name: 'Export' });
    expect(within(importPart).queryByRole('alert')).toBeNull();
    expect(within(importPart).getByRole('radiogroup')).not.toHaveAttribute('aria-invalid');
    expect(within(exportPart).getAllByRole('alert').map((a) => a.textContent)).toEqual(['Choose a rating or NA', 'A comment is required for this question']);
    expect(within(exportPart).getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
  });

  it('opens the follow-up and the comment rule only in the direction rated Fair or Poor', async () => {
    const onChange = vi.fn();
    render(<ImportExportQuestionCard question={Q1} index={1} answerFor={answers({ IMPORT: { ...emptyAnswer('q1', 'IMPORT'), rating: 4 }, EXPORT: { ...emptyAnswer('q1', 'EXPORT'), rating: 2 } })} onChange={onChange} />);
    const importPart = screen.getByRole('region', { name: 'Import' });
    const exportPart = screen.getByRole('region', { name: 'Export' });
    expect(within(importPart).queryByRole('group', { name: 'What went wrong?' })).toBeNull();
    expect(within(importPart).getByText('Optional · required for a Fair or Poor rating')).toBeInTheDocument();
    expect(within(exportPart).getByText('Required for a Fair or Poor rating')).toBeInTheDocument();

    await userEvent.click(within(exportPart).getByRole('checkbox', { name: 'Staff' }));
    expect(onChange).toHaveBeenLastCalledWith('EXPORT', { followUp: ['Staff'] });

    // Leaving the export comment empty surfaces the rule there, not under import.
    await userEvent.click(within(exportPart).getByLabelText(/Comment/));
    await userEvent.tab();
    expect(within(exportPart).getByRole('alert')).toHaveTextContent('A comment is required for a Fair or Poor rating');
    expect(within(importPart).queryByRole('alert')).toBeNull();
  });

  it('disables both directions when read-only', async () => {
    const onChange = vi.fn();
    render(<ImportExportQuestionCard question={Q3} index={3} answerFor={answers({ IMPORT: { ...emptyAnswer('q3', 'IMPORT'), rating: 3, comment: 'ok' }, EXPORT: { ...emptyAnswer('q3', 'EXPORT'), rating: 1, comment: 'slow' } })} onChange={onChange} readOnly />);
    const importPart = screen.getByRole('region', { name: 'Import' });
    const exportPart = screen.getByRole('region', { name: 'Export' });
    expect(within(importPart).getByRole('radio', { name: 'Good' })).toBeChecked();
    expect(within(exportPart).getByRole('radio', { name: 'Poor' })).toBeChecked();
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
    await userEvent.click(within(importPart).getByRole('radio', { name: 'Poor' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
