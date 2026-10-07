import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { type DateRange, type IsoDate, type YearMonth } from '@/lib/date';

import { Calendar, type CalendarMarkers } from './Calendar';

function Single({ onChange, initial = null, month: m0 = '2025-10', onMonthChange, ...rest }: { onChange?: (v: IsoDate | null) => void; initial?: IsoDate | null; month?: YearMonth; onMonthChange?: (m: YearMonth) => void; min?: IsoDate; max?: IsoDate; disabled?: (iso: IsoDate) => boolean; markers?: CalendarMarkers; today?: IsoDate }) {
  const [value, setValue] = useState<IsoDate | null>(initial);
  const [month, setMonth] = useState<YearMonth>(m0);
  return (
    <Calendar
      mode="single"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
      month={month}
      onMonthChange={(m) => {
        setMonth(m);
        onMonthChange?.(m);
      }}
      {...rest}
    />
  );
}

function Range({ onChange, initial = { start: null, end: null } }: { onChange?: (v: DateRange) => void; initial?: DateRange }) {
  const [value, setValue] = useState<DateRange>(initial);
  const [month, setMonth] = useState<YearMonth>('2025-10');
  return (
    <Calendar
      mode="range"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
      month={month}
      onMonthChange={setMonth}
    />
  );
}

const day = (iso: IsoDate) => {
  const el = document.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
  if (!el) throw new Error(`no cell for ${iso}`);
  return el;
};
const cellOf = (iso: IsoDate) => day(iso).closest('[role="gridcell"]') as HTMLElement;

describe('Calendar', () => {
  it('renders a labelled grid, Monday first, with the neighbouring days muted', () => {
    render(<Single today="2025-10-07" />);
    const grid = screen.getByRole('grid', { name: 'October 2025' });
    const headers = within(grid).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(within(grid).getAllByRole('row')).toHaveLength(7); // header + 6 weeks
    expect(day('2025-09-29')).toHaveAccessibleName('29 Sept 2025');
    expect(day('2025-10-07')).toHaveAccessibleName('7 Oct 2025, today');
    expect(day('2025-10-07')).toHaveAttribute('tabindex', '0'); // today is the roving day when nothing is selected
    expect(day('2025-10-08')).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus with the arrow keys, Home/End and the paging keys, changing month when needed', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Single initial="2025-10-08" onMonthChange={onMonthChange} />);
    day('2025-10-08').focus();

    await user.keyboard('{ArrowRight}');
    expect(day('2025-10-09')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(day('2025-10-16')).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowLeft}');
    expect(day('2025-10-08')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(day('2025-10-06')).toHaveFocus();
    await user.keyboard('{End}');
    expect(day('2025-10-12')).toHaveFocus();

    await user.keyboard('{PageDown}');
    expect(onMonthChange).toHaveBeenLastCalledWith('2025-11');
    expect(screen.getByRole('grid', { name: 'November 2025' })).toBeInTheDocument();
    expect(day('2025-11-12')).toHaveFocus();

    await user.keyboard('{Shift>}{PageUp}{/Shift}');
    expect(onMonthChange).toHaveBeenLastCalledWith('2024-11');
    expect(day('2024-11-12')).toHaveFocus();

    // Crossing a month edge with an arrow switches the month too.
    await user.keyboard('{End}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(day('2024-12-08')).toHaveFocus();
    expect(screen.getByRole('grid', { name: 'December 2024' })).toBeInTheDocument();
  });

  it('selects with Enter and Space and with a click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Single onChange={onChange} today="2025-10-07" />);
    day('2025-10-07').focus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2025-10-08');
    expect(cellOf('2025-10-08')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight} ');
    expect(onChange).toHaveBeenLastCalledWith('2025-10-09');
    await user.click(day('2025-10-20'));
    expect(onChange).toHaveBeenLastCalledWith('2025-10-20');
    expect(cellOf('2025-10-09')).not.toHaveAttribute('aria-selected');
  });

  it('picks a range start then end, swapping when the end is earlier, and previews on hover', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Range onChange={onChange} />);
    await user.click(day('2025-10-14'));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2025-10-14', end: null });

    await user.hover(day('2025-10-10'));
    expect(cellOf('2025-10-12').className).toContain('preview');
    expect(cellOf('2025-10-09').className).not.toContain('band');

    await user.click(day('2025-10-08'));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2025-10-08', end: '2025-10-14' });
    for (const d of ['2025-10-08', '2025-10-11', '2025-10-14']) expect(cellOf(d)).toHaveAttribute('aria-selected', 'true');
    expect(cellOf('2025-10-11').className).toContain('band');
    expect(cellOf('2025-10-11').className).not.toContain('preview');
    expect(cellOf('2025-10-15')).not.toHaveAttribute('aria-selected');

    // A third pick starts over.
    await user.click(day('2025-10-20'));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2025-10-20', end: null });
  });

  it('honours min/max and the disabled rule', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Single onChange={onChange} min="2025-10-06" max="2025-10-24" disabled={(iso) => iso === '2025-10-15'} />);
    for (const d of ['2025-10-05', '2025-10-25', '2025-10-15', '2025-09-30']) {
      expect(cellOf(d)).toHaveAttribute('aria-disabled', 'true');
      await user.click(day(d));
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(cellOf('2025-10-06')).not.toHaveAttribute('aria-disabled');
    await user.click(day('2025-10-06'));
    expect(onChange).toHaveBeenLastCalledWith('2025-10-06');
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('selects a trailing day inside the limits and follows it into its month', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onMonthChange = vi.fn();
    render(<Single onChange={onChange} onMonthChange={onMonthChange} />);
    await user.click(day('2025-11-02'));
    expect(onChange).toHaveBeenLastCalledWith('2025-11-02');
    expect(onMonthChange).toHaveBeenLastCalledWith('2025-11');
  });

  it('renders one marker chip per day plus a "+N" overflow with the full text in tooltips', () => {
    const markers: CalendarMarkers = {
      '2025-10-09': [{ label: 'Team bonding day', tone: 'warn' }],
      '2025-10-15': [{ label: 'Sampling closes', tone: 'accent' }, { label: 'Reminder 2' }, { label: 'Reminder 3' }],
    };
    render(<Single markers={markers} />);
    const chips9 = within(cellOf('2025-10-09')).getAllByText('Team bonding day');
    expect(chips9.length).toBeGreaterThanOrEqual(1);
    expect(within(cellOf('2025-10-15')).getByText('+2')).toBeInTheDocument();
    expect(within(cellOf('2025-10-15')).getByText('Reminder 2 · Reminder 3')).toBeInTheDocument();
    expect(day('2025-10-15')).toHaveAccessibleName('15 Oct 2025, 3 events');
    expect(day('2025-10-09')).toHaveAccessibleName('9 Oct 2025, Team bonding day');
    expect(within(cellOf('2025-10-10')).queryByText(/./)).toHaveTextContent('10');
  });

  it('changes month and year from the heading menu with the keyboard', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Single onMonthChange={onMonthChange} />);
    const trigger = screen.getByRole('button', { name: 'October 2025', expanded: false });
    await user.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Choose month and year' });
    expect(within(menu).getByRole('menuitemradio', { name: 'October' })).toHaveFocus();
    expect(within(menu).getByRole('menuitemradio', { name: '2025' })).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowRight}'); // year column
    expect(within(menu).getByRole('menuitemradio', { name: '2025' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}'); // 2026 keeps the menu open
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-10');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}{Home}{ArrowDown}{ArrowDown}{Enter}'); // March closes it
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-03');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'March 2026' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'March 2026' })).toHaveFocus();
  });
});
