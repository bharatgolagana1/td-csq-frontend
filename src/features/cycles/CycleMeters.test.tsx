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

  it('says nothing once the invitations are out, or when the API does not count them', () => {
    const { rerender } = render(<CycleMeters cycle={cycleSummary({ progress: { locked: 2, invited: 95, readyToSend: 0, completed: 40 } })} />);
    expect(screen.queryByText(/ready to send/)).toBeNull();
    rerender(<CycleMeters cycle={cycleSummary()} />);
    expect(screen.queryByText(/ready to send/)).toBeNull();
  });
});
