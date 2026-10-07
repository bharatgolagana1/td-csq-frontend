import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DateTimeInput, joinWall, splitWall } from './DateTimeInput';

function Harness({ onChange }: { onChange: (v: string | null) => void }) {
  const [value, setValue] = useState<string | null>(null);
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

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-03' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '09:30' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-03T09:30');

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('reflects an external value', () => {
    render(<DateTimeInput label="Closes" value="2026-12-01T18:00" onChange={() => undefined} />);
    expect(screen.getByLabelText('Date')).toHaveValue('2026-12-01');
    expect(screen.getByLabelText('Time')).toHaveValue('18:00');
  });
});
