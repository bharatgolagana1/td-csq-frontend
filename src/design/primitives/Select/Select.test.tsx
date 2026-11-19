import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './Select';

const options = [{ value: 'a', label: 'Alpha' }, { value: 'off', label: 'Disabled', disabled: true }, { value: 'b', label: 'Beta' }];

describe('Select', () => {
  it('updates a controlled value through a real select change event', async () => {
    const changed = vi.fn();
    function Example() {
      const [value, setValue] = useState('a');
      return <Select label="Choice" name="choice" value={value} options={options} onChange={(event) => {
        changed(event.target.name, event.target.value, event.currentTarget.tagName);
        setValue(event.target.value);
      }} />;
    }
    render(<Example />);
    const control = screen.getByRole('combobox');
    await userEvent.click(control);
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Beta' }));
    expect(changed).toHaveBeenCalledWith('choice', 'b', 'SELECT');
    expect(control).toHaveValue('b');
    expect(control).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('preserves form registration, validation, reset and submission', async () => {
    const submitted = vi.fn();
    function Example() {
      const { register, handleSubmit, reset } = useForm({ defaultValues: { choice: '' } });
      return <form onSubmit={handleSubmit(submitted)}>
        <Select label="Choice" placeholder="Choose" required options={options} {...register('choice', { required: true })} />
        <button type="submit">Submit</button>
        <button type="button" onClick={() => reset({ choice: 'b' })}>Reset</button>
      </form>;
    }
    render(<Example />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Choose' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Alpha' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(submitted.mock.calls[0]?.[0]).toEqual({ choice: 'a' });
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('combobox')).toHaveValue('b');
  });

  it('supports keyboard selection, disabled options, Escape and outside dismissal', async () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select ref={ref} label="Choice" defaultValue="a" options={options} />);
    ref.current?.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(ref.current).toHaveValue('b');
    await userEvent.keyboard('{ArrowDown}{Home}{Escape}');
    expect(ref.current).toHaveValue('b');
    expect(screen.queryByRole('listbox')).toBeNull();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it.each(['light', 'dark'])('retains the %s theme context and bounds the menu to the control', async (theme) => {
    render(<div data-theme={theme} data-testid="theme"><Select label="Choice" options={options} /></div>);
    const control = screen.getByRole('combobox');
    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue({ x: 20, y: 30, left: 20, top: 30, right: 260, bottom: 70, width: 240, height: 40, toJSON: () => ({}) });
    await userEvent.click(control);
    const menu = screen.getByRole('listbox');
    expect(screen.getByTestId('theme')).toContainElement(menu);
    expect(menu).toHaveStyle({ width: '240px', left: '20px', top: '76px' });
  });
});
