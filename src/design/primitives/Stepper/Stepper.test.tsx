import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Stepper, stepState } from './Stepper';

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'windows', label: 'Windows' },
  { id: 'review', label: 'Review' },
];

describe('Stepper', () => {
  it('derives step states', () => {
    expect(stepState(0, 1)).toBe('done');
    expect(stepState(1, 1)).toBe('current');
    expect(stepState(2, 1)).toBe('upcoming');
  });

  it('marks the current step and only lets completed steps be clicked', async () => {
    const onStepClick = vi.fn();
    render(<Stepper steps={STEPS} current={1} onStepClick={onStepClick} />);
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');

    await userEvent.click(screen.getByRole('button', { name: /Basics/ }));
    expect(onStepClick).toHaveBeenCalledWith(0);
    expect(screen.queryByRole('button', { name: /Review/ })).toBeNull();
  });
});
