import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';

import { AssessmentStepper } from './AssessmentStepper';
import { answer, COMPLETE, FORM } from './testFixtures';

function renderStepper(draft = COMPLETE, overrides: Partial<React.ComponentProps<typeof AssessmentStepper>> = {}) {
  const onSave = vi.fn().mockResolvedValue({ lastSavedAt: '2026-10-07T06:34:00.000Z' });
  const onSubmit = vi.fn().mockResolvedValue({ status: 'SUBMITTED' });
  const onSubmitted = vi.fn();
  render(<AssessmentStepper form={FORM} draft={draft} onSave={onSave} onSubmit={onSubmit} onSubmitted={onSubmitted} {...overrides} />);
  return { onSave, onSubmit, onSubmitted };
}

describe('AssessmentStepper', () => {
  it('walks the categories, then the review, with every section reachable from the step list', async () => {
    renderStepper([]);
    expect(screen.getByRole('heading', { level: 2, name: 'Cargo handling' })).toBeInTheDocument();
    expect(screen.getByText('0 of 4 answered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Security' })).toBeInTheDocument();
    // Leaving the first section incomplete turned its validation on.
    await userEvent.click(screen.getByRole('button', { name: /Cargo handling/ }));
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Choose a rating or NA');

    await userEvent.click(screen.getByRole('button', { name: /Review & submit/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Review and submit' })).toBeInTheDocument();
    expect(screen.getByText('4 items need attention')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();

    // A jump link lands on the question's section.
    await userEvent.click(screen.getByRole('button', { name: /Q3/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Security' })).toBeInTheDocument();
    expect(document.activeElement?.id).toBe('q-q3');
  });

  it('reports progress as answers are made and enables Submit once complete', async () => {
    const onProgress = vi.fn();
    const { onSave } = renderStepper([answer('q1'), answer('q2'), answer('q3', { comment: 'Fine' })], { onProgress });
    expect(onProgress).toHaveBeenLastCalledWith({ answered: 3, total: 4, pct: 75 });

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Security' })).toBeInTheDocument();
    // q3 already holds "Very good"; the second one belongs to q4.
    await userEvent.click(screen.getAllByRole('radio', { name: 'Very good' })[1] as HTMLElement);
    expect(onProgress).toHaveBeenLastCalledWith({ answered: 4, total: 4, pct: 100 });
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([{ questionId: 'q4', rating: 4, na: false, comment: null, followUp: [] }]), { timeout: 2000 });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Saved/));

    await userEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(screen.getByText('Everything is answered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  it('confirms before submitting, shows a failed submit in the sheet, and reports success', async () => {
    const { onSubmit, onSubmitted } = renderStepper(COMPLETE, { initialStep: 2, submitNote: 'Self scores stay separate.' });
    onSubmit.mockRejectedValueOnce(new ApiError(412, 'PRECONDITION_FAILED', 'Answer every question before submitting', undefined, 'req_42'));

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Submit your answers?' });
    expect(within(dialog).getByText('Self scores stay separate.')).toBeInTheDocument();
    expect(within(dialog).getByText(/4 of 4 questions answered/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('req_42');
    expect(onSubmitted).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('IMPORT_EXPORT: counts both directions, lists each missing one in the review and jumps to that direction', async () => {
    // Everything answered for import except q4; export only for the first section.
    const draft = [answer('q1', { direction: 'IMPORT' }), answer('q2', { direction: 'IMPORT' }), answer('q3', { direction: 'IMPORT', comment: 'Fine' }), answer('q1', { direction: 'EXPORT' }), answer('q2', { direction: 'EXPORT' })];
    const onProgress = vi.fn();
    const { onSave } = renderStepper(draft, { answerMode: 'IMPORT_EXPORT', onProgress });
    expect(onProgress).toHaveBeenLastCalledWith({ answered: 5, total: 8, pct: 63 });
    expect(screen.getByText('4 of 4 answered in this section')).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Import' })).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: /Review & submit/ }));
    expect(screen.getByText('3 items need attention')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Q\d/ }).map((b) => b.textContent)).toEqual([
      'Q3How would you rate security screening?Security · ExportNot answered',
      'Q4How would you rate the overall experience?Security · ImportNot answered',
      'Q4How would you rate the overall experience?Security · ExportNot answered',
    ]);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Q4.*Security · Export/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Security' })).toBeInTheDocument();
    expect(document.activeElement?.id).toBe('q-q4-export');
    // The jump turned validation on: the unanswered direction says so, the answered one stays quiet.
    expect(within(document.activeElement as HTMLElement).getByRole('alert')).toHaveTextContent('Choose a rating or NA');
    expect(within(document.getElementById('q-q3-import') as HTMLElement).queryByRole('alert')).toBeNull();

    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'How would you rate the overall experience? — Export' })).getByRole('radio', { name: 'Good' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([{ questionId: 'q4', direction: 'EXPORT', rating: 3, na: false, comment: null, followUp: [] }]), { timeout: 2000 });
    expect(onProgress).toHaveBeenLastCalledWith({ answered: 6, total: 8, pct: 75 });
  });
});
