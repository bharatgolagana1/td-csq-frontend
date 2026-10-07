import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { type IsoDate } from '@/lib/date';

import { DatePicker } from './DatePicker';

function Harness({ onChange, initial = null, ...rest }: { onChange?: (v: IsoDate | null) => void; initial?: IsoDate | null; min?: IsoDate; max?: IsoDate; tz?: string; disabled?: boolean }) {
  const [value, setValue] = useState<IsoDate | null>(initial);
  return (
    <>
      <button type="button">Elsewhere</button>
      <DatePicker
        label="Sampling opens"
        hint="Wall date"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange?.(v);
        }}
        today="2025-10-07"
        {...rest}
      />
    </>
  );
}

const day = (iso: IsoDate) => {
  const el = document.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
  if (!el) throw new Error(`no cell for ${iso}`);
  return el;
};
const flushRaf = () =>
  act(async () => {
    await new Promise((r) => requestAnimationFrame(r));
  });

describe('DatePicker', () => {
  it('opens from the calendar button, focuses the roving day, applies the draft and restores focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText('Sampling opens');
    expect(input).toHaveAccessibleDescription('Wall date');
    const opener = screen.getByRole('button', { name: 'Open calendar' });
    expect(opener).toHaveAttribute('aria-expanded', 'false');

    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Choose a date' });
    expect(opener).toHaveAttribute('aria-expanded', 'true');
    expect(dialog).not.toHaveAttribute('aria-modal');
    await flushRaf();
    expect(day('2025-10-07')).toHaveFocus(); // today, nothing selected yet

    await user.click(day('2025-10-14'));
    expect(onChange).not.toHaveBeenCalled(); // draft only
    expect(input).toHaveValue('');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith('2025-10-14');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(input).toHaveValue('14 Oct 2025');
    expect(opener).toHaveFocus();
  });

  it('discards the draft on Cancel and on Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial="2025-10-08" />);
    const input = screen.getByLabelText('Sampling opens');
    expect(input).toHaveValue('8 Oct 2025');

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await user.click(day('2025-10-20'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('8 Oct 2025');

    input.focus();
    await user.keyboard('{ArrowDown}'); // opens from the field too
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await flushRaf();
    expect(day('2025-10-08')).toHaveFocus(); // the current value is the roving day
    await user.keyboard('{ArrowRight}{Enter}{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
  });

  it('closes on an outside click without stealing focus, and Tab cycles inside', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    const dialog = screen.getByRole('dialog');
    await flushRaf();
    const apply = within(dialog).getByRole('button', { name: 'Apply' });
    apply.focus();
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(apply).not.toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('accepts a typed date, reformats on blur, clears, and reflects an external value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText('Sampling opens');

    await user.type(input, '08/10/2025');
    expect(onChange).toHaveBeenLastCalledWith('2025-10-08');
    expect(input).toHaveValue('08/10/2025'); // untouched while typing
    await user.tab();
    expect(input).toHaveValue('8 Oct 2025');

    await user.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear date' })).toBeNull();

    // ISO via a change event (how forms set it programmatically) commits at once.
    fireEvent.change(input, { target: { value: '2026-01-31' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-01-31');
    expect(input).toHaveValue('31 Jan 2026');

    rerender(<DatePicker label="Other" value="2026-12-01" onChange={() => undefined} />);
    expect(screen.getByLabelText('Other')).toHaveValue('1 Dec 2026');
  });

  it('ignores typed dates outside min/max and shows the zone caption', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} min="2025-10-06" max="2025-10-24" tz="Asia/Kolkata" />);
    const input = screen.getByLabelText('Sampling opens');
    await user.type(input, '2025-11-01');
    expect(onChange).not.toHaveBeenCalled();
    await user.tab();
    expect(input).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Dates in Asia/Kolkata');
    expect(day('2025-10-25').closest('[role="gridcell"]')).toHaveAttribute('aria-disabled', 'true');
  });

  it('opens as a modal bottom sheet on phones', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({ matches: query.includes('max-width'), media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      const user = userEvent.setup();
      render(<Harness />);
      const input = screen.getByLabelText('Sampling opens');
      expect(input).toHaveAttribute('readonly');
      await user.click(input);
      const dialog = screen.getByRole('dialog', { name: 'Choose a date' });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(document.body.style.overflow).toBe('hidden');
      await user.click(screen.getByTestId('date-sheet-backdrop'));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.body.style.overflow).toBe('');
    } finally {
      window.matchMedia = original;
    }
  });
});
