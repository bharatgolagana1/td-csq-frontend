import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth/keycloak', () => ({ getAccessToken: vi.fn(async () => 'tok'), forceRefreshToken: vi.fn(async () => false) }));

import { type CycleStatus } from '@/api/cycles.types';

import { BuilderProvider } from './builderContext';
import { type BuilderValues, defaultBuilderValues } from './builderSchema';
import { cycleSummary, SETTINGS, window } from './fixtures';
import { list, mockApi } from './testSupport';
import { WindowsStep } from './WindowsStep';

function Harness() {
  const form = useForm<BuilderValues>({ defaultValues: defaultBuilderValues(SETTINGS) });
  return <BuilderProvider value={{ form, settings: SETTINGS, cycle: null, step: 'windows', goTo: () => undefined, airports: [], operators: [], shareTotals: null, referenceLoading: false, referenceError: null }}><WindowsStep /></BuilderProvider>;
}

afterEach(() => vi.unstubAllGlobals());

function setup(status: CycleStatus = 'ASSESSMENT_OPEN') {
  const { calls } = mockApi([{ path: '/cycles', reply: () => list([cycleSummary({ status, sampling: window('2026-10-01T09:00', '2026-10-11T00:00') })]) }]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={queryClient}><Harness /></QueryClientProvider>);
  return calls;
}

describe('WindowsStep calendars', () => {
  const inputs = ['Initiation date', 'Sampling opens', 'Sampling closes', 'Assessment opens', 'Assessment closes'];
  const dateInput = (label: string) => label === 'Initiation date'
    ? screen.getByLabelText(label)
    : within(screen.getByRole('group', { name: label })).getByLabelText('Date');
  const calendarButton = (label: string) => {
    const button = label === 'Initiation date'
      ? screen.getAllByRole('button', { name: 'Open calendar' })[0]
      : within(screen.getByRole('group', { name: label })).getByRole('button', { name: 'Open calendar' });
    if (!button) throw new Error(`No calendar button for ${label}`);
    return button;
  };

  it.each(inputs)('keeps reserved days visible and unselectable in %s without schedule messages', async (label) => {
    const calls = setup();
    await waitFor(() => expect(calls).toHaveLength(1));
    await waitFor(() => expect(dateInput(label)).toBeEnabled());
    fireEvent.change(dateInput(label), { target: { value: '2026-09-30' } });
    fireEvent.change(dateInput(label), { target: { value: '2026-10-01' } });
    fireEvent.blur(dateInput(label));
    expect(dateInput(label)).toHaveValue('30 Sept 2026');
    fireEvent.click(calendarButton(label));
    expect(document.querySelector('[data-iso="2026-09-30"]')?.closest('[role="gridcell"]')).not.toHaveAttribute('aria-disabled');
    const reserved = document.querySelector('[data-iso="2026-10-01"]');
    expect(reserved).toBeVisible();
    expect(reserved?.closest('[role="gridcell"]')).toHaveAttribute('aria-disabled', 'true');
    if (!reserved) throw new Error('Reserved day should stay visible');
    fireEvent.click(reserved);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(dateInput(label)).toHaveValue('30 Sept 2026');
    expect(screen.queryByRole('alert')).toBeNull();

    // The previous cycle ends at midnight: its end day is available again.
    fireEvent.change(dateInput(label), { target: { value: '2026-11-10' } });
    fireEvent.click(calendarButton(label));
    expect(document.querySelector('[data-iso="2026-11-09"]')?.closest('[role="gridcell"]')).toHaveAttribute('aria-disabled', 'true');
    expect(document.querySelector('[data-iso="2026-11-10"]')?.closest('[role="gridcell"]')).not.toHaveAttribute('aria-disabled');
  });

  it.each(['DRAFT', 'ASSESSMENT_CLOSED', 'SCORED', 'ARCHIVED'] as const)('allows dates from a %s cycle', async (status) => {
    const calls = setup(status);
    await waitFor(() => expect(calls).toHaveLength(1));
    await waitFor(() => expect(dateInput('Initiation date')).toBeEnabled());
    fireEvent.change(dateInput('Initiation date'), { target: { value: '2026-10-03' } });
    fireEvent.click(calendarButton('Initiation date'));
    expect(document.querySelector('[data-iso="2026-10-03"]')?.closest('[role="gridcell"]')).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
