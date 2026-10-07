import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { type DateRange, type IsoDate } from '@/lib/date';

import { DateRangePicker, type DateRangePreset } from './DateRangePicker';

const PRESETS: DateRangePreset[] = [
  { label: 'Next 10 days', range: { start: '2025-10-07', end: '2025-10-16' } },
  { label: 'Next 30 days', range: { start: '2025-10-07', end: '2025-11-05' } },
];

function Harness({ onChange, initial = { start: null, end: null } }: { onChange?: (v: DateRange) => void; initial?: DateRange }) {
  const [value, setValue] = useState<DateRange>(initial);
  return (
    <DateRangePicker
      label="Assessment window"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
      presets={PRESETS}
      today="2025-10-07"
      tz="Asia/Kolkata"
    />
  );
}

const day = (iso: IsoDate) => {
  const el = document.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
  if (!el) throw new Error(`no cell for ${iso}`);
  return el;
};

describe('DateRangePicker', () => {
  it('picks a range in the popover, blocks Apply until the end is set, and commits on Apply', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Assessment window' });
    expect(trigger).toHaveTextContent('Start – end');

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Choose dates' });
    const apply = within(dialog).getByRole('button', { name: 'Apply' });
    expect(apply).toBeEnabled();
    await user.click(day('2025-10-14'));
    expect(apply).toBeDisabled();
    await user.click(day('2025-10-08'));
    expect(apply).toBeEnabled();
    expect(onChange).not.toHaveBeenCalled();
    await user.click(apply);
    expect(onChange).toHaveBeenLastCalledWith({ start: '2025-10-08', end: '2025-10-14' });
    expect(trigger).toHaveTextContent('8 Oct 2025 – 14 Oct 2025');
    expect(trigger).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Clear dates' }));
    expect(onChange).toHaveBeenLastCalledWith({ start: null, end: null });
    expect(trigger).toHaveTextContent('Start – end');
  });

  it('applies a preset into the draft and discards it on Cancel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Assessment window' }));
    const presets = screen.getByRole('group', { name: 'Quick ranges' });
    await user.click(within(presets).getByRole('button', { name: 'Next 30 days' }));
    expect(within(presets).getByRole('button', { name: 'Next 30 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(day('2025-10-07').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(day('2025-10-31').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Assessment window' })).toHaveTextContent('Start – end');

    await user.click(screen.getByRole('button', { name: 'Assessment window' }));
    await user.click(screen.getByRole('button', { name: 'Next 10 days' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith(PRESETS[0]?.range);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on the current start month with the start as the roving day', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ start: '2025-12-20', end: '2026-01-03' }} />);
    await user.click(screen.getByRole('button', { name: 'Assessment window' }));
    expect(screen.getByRole('grid', { name: 'December 2025' })).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(r));
    });
    expect(day('2025-12-20')).toHaveFocus();
    expect(day('2025-12-31').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('dialog')).toHaveTextContent('Dates in Asia/Kolkata');
  });
});
