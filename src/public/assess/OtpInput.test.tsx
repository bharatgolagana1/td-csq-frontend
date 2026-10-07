import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { OtpInput } from './OtpInput';

function Harness({ onComplete, invalid }: { onComplete?: (v: string) => void; invalid?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <>
      <OtpInput value={value} onChange={setValue} onComplete={onComplete} focusWhenEmpty invalid={invalid} describedBy="hint" />
      <output data-testid="value">{value}</output>
    </>
  );
}

const boxes = () => screen.getAllByRole('textbox') as HTMLInputElement[];

describe('OtpInput', () => {
  it('renders six labelled boxes with the one-time-code hint on the first', () => {
    render(<Harness />);
    const inputs = boxes();
    expect(inputs).toHaveLength(6);
    expect(inputs[0]).toHaveAttribute('aria-label', 'Digit 1 of 6');
    expect(inputs[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(inputs[0]).toHaveAttribute('inputmode', 'numeric');
    expect(inputs[0]).toHaveFocus();
  });

  it('auto-advances while typing and fires onComplete on the sixth digit', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await user.keyboard('12');
    expect(boxes()[2]).toHaveFocus();
    expect(screen.getByTestId('value')).toHaveTextContent('12');
    await user.keyboard('3456');
    expect(screen.getByTestId('value')).toHaveTextContent('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('ignores non-digits', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard('a-1');
    expect(screen.getByTestId('value')).toHaveTextContent('1');
  });

  it('accepts a pasted code anywhere, stripping separators', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await user.click(boxes()[3] as HTMLInputElement);
    await user.paste('482 913');
    expect(screen.getByTestId('value')).toHaveTextContent('482913');
    expect(onComplete).toHaveBeenCalledWith('482913');
    expect(boxes()[5]).toHaveFocus();
  });

  it('backspace clears the current box, then walks back', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard('123');
    expect(boxes()[3]).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('value')).toHaveTextContent('12');
    expect(boxes()[2]).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('value')).toHaveTextContent('1');
    expect(boxes()[1]).toHaveFocus();
  });

  it('arrow keys move between boxes', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(boxes()[2]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(boxes()[1]).toHaveFocus();
    await user.keyboard('{End}');
    expect(boxes()[5]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(boxes()[0]).toHaveFocus();
  });

  it('marks every box invalid and described by the hint', () => {
    render(<Harness invalid />);
    boxes().forEach((b) => {
      expect(b).toHaveAttribute('aria-invalid', 'true');
      expect(b).toHaveAttribute('aria-describedby', 'hint');
    });
  });
});
