import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OnboardingPage from './OnboardingPage';
import { apiError, APPROVED, data, list, mockApi, renderPage, SUBMITTED, SUBMITTED_DETAIL } from './testUtils';

afterEach(() => vi.unstubAllGlobals());

/* The server can refuse an approval (a code that exists, an admin e-mail in
   use, a share set over 100 %). The reviewer must see why, and keep what they
   typed: the form stays until the server has agreed. */

describe('OnboardingPage · a refused approval', () => {
  it('shows the reason and keeps the code and note the reviewer typed', async () => {
    mockApi([
      { method: 'GET', path: /^\/onboarding\/links$/, reply: () => list([]) },
      { method: 'GET', path: /^\/registrations$/, reply: () => list([SUBMITTED, APPROVED]) },
      { method: 'GET', path: /^\/registrations\/reg-1$/, reply: () => data(SUBMITTED_DETAIL) },
      // A real server takes a moment: long enough for the drawer to re-render before the refusal arrives.
      { method: 'POST', path: /^\/registrations\/reg-1\/approve$/, reply: () => new Promise((resolve) => setTimeout(() => resolve(apiError(409, 'CONFLICT', 'Organisation code BOM-MACH already exists')), 50)) },
    ]);
    renderPage(<OnboardingPage />, { route: '/registrations/reg-1', path: '/registrations/:id' });
    const dialog = await screen.findByRole('dialog', { name: 'Delhi Cargo Handlers' });
    // The shares must total 100 % before Approve is enabled.
    const shares = await within(dialog).findByRole('region', { name: 'Market share after approval' });
    await userEvent.click(within(shares).getByRole('button', { name: 'Scale the others to fit' }));

    const code = within(dialog).getByLabelText(/Organisation code/);
    await userEvent.clear(code);
    await userEvent.type(code, 'BOM-MACH');
    await userEvent.type(within(dialog).getByLabelText(/Note/), 'Checked with ACFI');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve and invite administrator' }));

    expect(await screen.findByText(/Organisation code BOM-MACH already exists/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Organisation code/)).toHaveValue('BOM-MACH');
    expect(within(dialog).getByLabelText(/Note/)).toHaveValue('Checked with ACFI');
    expect(within(dialog).getByRole('button', { name: 'Approve and invite administrator' })).toBeEnabled();
  });
});
