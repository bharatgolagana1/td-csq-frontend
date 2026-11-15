import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CycleMeters } from './CycleMeters';
import { cycleSummary } from './fixtures';

describe('CycleMeters', () => {
  it('notes the invitations ready to send while none is e-mailed yet', () => {
    render(<CycleMeters cycle={cycleSummary({ status: 'SAMPLING_CLOSED', progress: { locked: 2, invited: 0, readyToSend: 27, completed: 0 } })} />);
    expect(screen.getByRole('progressbar', { name: 'Invited' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByTitle('27 ready to send when the assessment opens')).toHaveTextContent('27 ready to send');
  });

  it('measures invitations against those the locked samples prepared, never past 100 %', () => {
    const { rerender } = render(<CycleMeters cycle={cycleSummary({ status: 'ASSESSMENT_OPEN', minSampleSize: 30, participants: { airports: 5, operators: 13 }, progress: { locked: 13, invited: 565, readyToSend: 0, completed: 390 } })} />);
    const invited = screen.getByRole('progressbar', { name: 'Invited' });
    expect(invited).toHaveAttribute('aria-valuenow', '100');
    expect(invited.nextSibling).toHaveTextContent('565 / 565');
    expect(screen.getByRole('progressbar', { name: 'Completed' }).nextSibling).toHaveTextContent('390 / 565');
    rerender(<CycleMeters cycle={cycleSummary({ status: 'ASSESSMENT_OPEN', progress: { locked: 4, invited: 10, readyToSend: 30, completed: 2 } })} />);
    expect(screen.getByRole('progressbar', { name: 'Invited' })).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByRole('progressbar', { name: 'Invited' }).nextSibling).toHaveTextContent('10 / 40');
    for (const bar of screen.getAllByRole('progressbar')) expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(100);
  });

  it('says nothing once the invitations are out, or when the API does not count them', () => {
    const { rerender } = render(<CycleMeters cycle={cycleSummary({ progress: { locked: 2, invited: 95, readyToSend: 0, completed: 40 } })} />);
    expect(screen.queryByText(/ready to send/)).toBeNull();
    rerender(<CycleMeters cycle={cycleSummary()} />);
    expect(screen.queryByText(/ready to send/)).toBeNull();
  });
});
