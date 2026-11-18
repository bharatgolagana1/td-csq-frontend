import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MarketShareSelect } from './MarketShareSelect';

const options = [
  { value: 'del', label: 'DEL · Indira Gandhi International Airport' },
  { value: 'bom', label: 'BOM · Chhatrapati Shivaji Maharaj International Airport' },
  { value: 'off', label: 'Unavailable', disabled: true },
];

describe('MarketShareSelect', () => {
  it('opens a labelled list, selects the full option value and closes', async () => {
    const onChange = vi.fn();
    render(<MarketShareSelect label="Airport" value="del" options={options} onChange={onChange} />);
    const control = screen.getByRole('combobox', { name: 'Airport' });
    await userEvent.click(control);
    expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: 'Airport' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: options[1]?.label }));
    expect(onChange).toHaveBeenCalledWith('bom');
    expect(control).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports keyboard navigation, skips disabled options and cancels without changing', async () => {
    const onChange = vi.fn();
    render(<MarketShareSelect label="Airport" value="del" options={options} onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{End}{Enter}');
    expect(onChange).toHaveBeenCalledWith('bom');
    onChange.mockClear();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports typing an airport code and dismissal outside the control', async () => {
    const onChange = vi.fn();
    render(<MarketShareSelect label="Airport" value="del" options={options} onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('bom{Enter}');
    expect(onChange).toHaveBeenCalledWith('bom');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
