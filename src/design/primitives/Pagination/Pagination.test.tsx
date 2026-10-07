import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { pageCount, Pagination } from './Pagination';

describe('Pagination', () => {
  it('computes page counts', () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
    expect(pageCount(132, 25)).toBe(6);
  });

  it('shows the visible range and disables bounds', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={25} total={132} onPageChange={onPageChange} />);
    expect(screen.getByText('1–25 of 132')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('clamps an out-of-range page and reports "No results"', () => {
    render(<Pagination page={9} pageSize={25} total={0} onPageChange={() => undefined} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('changes page size', async () => {
    const onPageSizeChange = vi.fn();
    render(<Pagination page={1} pageSize={25} total={132} onPageChange={() => undefined} onPageSizeChange={onPageSizeChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), '50');
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
