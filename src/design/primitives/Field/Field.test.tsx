import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Checkbox } from '../Checkbox/Checkbox';
import { Input } from '../Input/Input';
import { ErrorLine } from './Field';

describe('Field', () => {
  it('describes the control by its error, announced as an alert', () => {
    render(<Input label="Organisation name" error="Enter the organisation name" />);
    const input = screen.getByLabelText('Organisation name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter the organisation name');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the organisation name');
  });

  it('keeps the line of a cleared error, so the form below does not move under the next click', () => {
    const { container, rerender } = render(<Input label="Organisation name" error="Enter the organisation name" />);
    expect(container.querySelector('[data-reserved-error-line]')).toBeNull();
    rerender(<Input label="Organisation name" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Organisation name')).not.toHaveAttribute('aria-describedby');
    const reserved = container.querySelector('[data-reserved-error-line]');
    expect(reserved).not.toBeNull();
    expect(reserved).toHaveAttribute('aria-hidden', 'true');
    rerender(<Input label="Organisation name" error="Too long" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Too long');
    expect(container.querySelector('[data-reserved-error-line]')).toBeNull();
  });

  it('reserves nothing for a field that never showed an error', () => {
    const { container } = render(<Input label="Legal name" />);
    expect(container.querySelector('[data-reserved-error-line]')).toBeNull();
  });

  it('lets the click that clears an error on blur land on the next control', async () => {
    function Form() {
      const [name, setName] = useState('');
      const [touched, setTouched] = useState(false);
      return (
        <>
          <Input label="Organisation name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} error={touched && name ? undefined : 'Enter the organisation name'} />
          <Checkbox label="International cargo" />
        </>
      );
    }
    const { container } = render(<Form />);
    await userEvent.type(screen.getByLabelText('Organisation name'), 'Cargo Co');
    await userEvent.click(screen.getByLabelText('International cargo'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.querySelector('[data-reserved-error-line]')).not.toBeNull();
    expect(screen.getByLabelText('International cargo')).toBeChecked();
  });

  it('gives a group’s own error line the same reserve once it clears', () => {
    const { container, rerender } = render(<ErrorLine error="Choose at least one" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose at least one');
    rerender(<ErrorLine />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.querySelector('[data-reserved-error-line]')).toHaveAttribute('aria-hidden', 'true');
  });
});
