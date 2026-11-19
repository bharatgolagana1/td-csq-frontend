import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DateTimeInput, joinWall, splitWall } from './DateTimeInput';
import { normaliseTime } from './TimeField';

function Harness({ onChange, initial = null }: { onChange: (v: string | null) => void; initial?: string | null }) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <DateTimeInput
      label="Sampling opens"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      tz="Asia/Kolkata"
    />
  );
}

describe('DateTimeInput', () => {
  it('splits and joins wall-clock values', () => {
    expect(splitWall('2026-11-03T09:30')).toEqual({ date: '2026-11-03', time: '09:30' });
    expect(splitWall(null)).toEqual({ date: '', time: '' });
    expect(joinWall('2026-11-03', '09:30')).toBe('2026-11-03T09:30');
    expect(joinWall('2026-11-03', '')).toBeNull();
  });

  it('emits only when both parts are present and shows the zone caption', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Sampling opens' });
    expect(group).toHaveTextContent('Asia/Kolkata');
    expect(group).toHaveTextContent('UTC+05:30');

    // The Date field accepts ISO through a change event (forms set it programmatically).
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-03' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '09:30' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-03T09:30');

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('reflects an external value in the display format', () => {
    render(<DateTimeInput label="Closes" value="2026-12-01T18:00" onChange={() => undefined} />);
    expect(screen.getByLabelText('Date')).toHaveValue('1 Dec 2026');
    expect(screen.getByLabelText('Time')).toHaveValue('18:00');
  });

  it('round-trips a pick from the calendar plus a typed time, and steps the time with the arrows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial="2026-11-03T09:30" />);
    const group = screen.getByRole('group', { name: 'Sampling opens' });

    await user.click(within(group).getByRole('button', { name: 'Open calendar' }));
    const dialog = screen.getByRole('dialog', { name: 'Choose a date' });
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(r));
    });
    await user.keyboard('{ArrowRight}{Enter}');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-04T09:30');
    expect(screen.getByLabelText('Date')).toHaveValue('4 Nov 2026');

    const time = screen.getByLabelText('Time') as HTMLInputElement;
    await user.clear(time);
    expect(onChange).toHaveBeenLastCalledWith(null);
    await user.type(time, '1815');
    expect(onChange).toHaveBeenLastCalledWith(null); // not a full HH:mm yet
    await user.tab();
    expect(time).toHaveValue('18:15');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-04T18:15');

    time.focus();
    time.setSelectionRange(1, 1);
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-04T19:15');
    time.setSelectionRange(4, 4);
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-04T19:00');
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-04T18:59');
  });

  it('normalises typed times', () => {
    expect(normaliseTime('9:5')).toBe('09:05');
    expect(normaliseTime('930')).toBe('09:30');
    expect(normaliseTime('9')).toBe('09:00');
    expect(normaliseTime('2359')).toBe('23:59');
    expect(normaliseTime('24:00')).toBeNull();
    expect(normaliseTime('abc')).toBeNull();
    expect(normaliseTime('')).toBeNull();
  });
  it('applies selected hours and minutes while preserving the date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-11-03T09:30" onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Choose time' });
    await user.click(trigger);
    const picker = screen.getByRole('dialog', { name: 'Choose a time' });
    expect(within(picker).getByLabelText('Hour')).toHaveFocus();
    await user.click(within(picker).getByRole('combobox', { name: 'Hour' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', { name: '18' }));
    await user.click(within(picker).getByRole('combobox', { name: 'Minute' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Minute' })).getByRole('option', { name: '47' }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(within(picker).getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-03T18:47');
    expect(screen.getByLabelText('Time')).toHaveValue('18:47');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('cancels time selection with Escape and prevents selection when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<DateTimeInput label="Closes" value="2026-12-01T18:00" onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Choose time' });
    await user.click(trigger);
    await user.click(screen.getByRole('combobox', { name: 'Hour' }));
    await user.click(within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', { name: '20' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
    rerender(<DateTimeInput label="Closes" value="2026-12-01T18:00" onChange={onChange} disabled />);
    expect(trigger).toBeDisabled();
    expect(screen.getByLabelText('Time')).toBeDisabled();
  });

  it('uses the shared hour menu and closes that menu before the time picker on Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimeInput label="Closes" value="2026-12-01T18:00" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    await user.click(screen.getByRole('combobox', { name: 'Hour' }));
    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Choose a time' })).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Hour' }));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: '20' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-12-01T20:00');
  });

});
