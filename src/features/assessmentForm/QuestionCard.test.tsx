import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { QuestionCard } from './QuestionCard';
import { emptyAnswer } from './rules';
import { Q1, Q2, Q3 } from './testFixtures';

describe('QuestionCard', () => {
  it('renders the six-option rating as a radio group named by the question, with toggleable help', async () => {
    const onChange = vi.fn();
    render(<QuestionCard question={Q1} index={7} section="Shipment acceptance" answer={undefined} onChange={onChange} />);
    const group = screen.getByRole('radiogroup', { name: Q1.text });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['5', '4', '3', '2', '1', 'NA']);
    expect(screen.getByText('Q7')).toBeInTheDocument();
    expect(screen.queryByText(Q1.help ?? '')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'About this question' }));
    expect(screen.getByText(Q1.help ?? '')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Excellent' }));
    expect(onChange).toHaveBeenCalledWith({ rating: 5, na: false });
    await userEvent.click(screen.getByRole('radio', { name: 'Not applicable' }));
    expect(onChange).toHaveBeenCalledWith({ na: true, rating: null });
  });

  it('shows the follow-up options and the required comment on Fair / Poor', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<QuestionCard question={Q1} index={1} answer={{ ...emptyAnswer('q1'), rating: 4 }} onChange={onChange} />);
    expect(screen.queryByText('What went wrong?')).toBeNull();
    expect(screen.getByText('Optional · required for a Fair or Poor rating')).toBeInTheDocument();

    rerender(<QuestionCard question={Q1} index={1} answer={{ ...emptyAnswer('q1'), rating: 2, followUp: ['Queues'] }} onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'What went wrong?' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Queues' })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Staff' }));
    expect(onChange).toHaveBeenCalledWith({ followUp: ['Queues', 'Staff'] });
    expect(screen.getByText('Required for a Fair or Poor rating')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();

    // Leaving the comment empty surfaces the rule inline.
    const comment = screen.getByLabelText(/Comment/);
    await userEvent.click(comment);
    await userEvent.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('A comment is required for a Fair or Poor rating');
  });

  it('hides the comment on NONE and requires it on REQUIRED', () => {
    const { rerender } = render(<QuestionCard question={Q2} index={2} answer={undefined} onChange={vi.fn()} />);
    expect(screen.queryByLabelText(/Comment/)).toBeNull();

    rerender(<QuestionCard question={Q3} index={3} answer={{ ...emptyAnswer('q3'), rating: 5 }} onChange={vi.fn()} showValidation />);
    expect(screen.getByLabelText(/Comment/)).toBeRequired();
    expect(screen.getByRole('alert')).toHaveTextContent('A comment is required for this question');
  });

  it('flags a missing rating only when validation is requested, and disables everything when read-only', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<QuestionCard question={Q3} index={3} answer={undefined} onChange={onChange} />);
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<QuestionCard question={Q3} index={3} answer={undefined} onChange={onChange} showValidation />);
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Choose a rating or NA');
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');

    rerender(<QuestionCard question={Q3} index={3} answer={{ ...emptyAnswer('q3'), rating: 3, comment: 'ok' }} onChange={onChange} readOnly />);
    expect(screen.getByRole('radio', { name: 'Good' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Good' })).toBeDisabled();
    expect(screen.getByLabelText(/Comment/)).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Poor' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
