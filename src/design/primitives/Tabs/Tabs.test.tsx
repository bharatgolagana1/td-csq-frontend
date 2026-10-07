import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Tabs } from './Tabs';

const TABS = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta', count: 3 },
  { id: 'c', label: 'Gamma', disabled: true },
  { id: 'd', label: 'Delta' },
];

function Harness() {
  const [value, setValue] = useState('a');
  return <Tabs tabs={TABS} value={value} onChange={setValue} aria-label="Demo" />;
}

describe('Tabs', () => {
  it('uses a roving tabindex and selects with arrow keys, skipping disabled tabs', async () => {
    render(<Harness />);
    const alpha = screen.getByRole('tab', { name: /Alpha/ });
    const beta = screen.getByRole('tab', { name: /Beta/ });
    const delta = screen.getByRole('tab', { name: /Delta/ });
    expect(alpha).toHaveAttribute('tabindex', '0');
    expect(beta).toHaveAttribute('tabindex', '-1');

    alpha.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(beta).toHaveAttribute('aria-selected', 'true');
    expect(beta).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(delta).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{Home}');
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(delta).toHaveAttribute('aria-selected', 'true');
  });

  it('renders route tabs as links with aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/users/roles']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Tabs
          tabs={[
            { id: 'users', label: 'Users', to: '/users' },
            { id: 'roles', label: 'Roles', to: '/users/roles' },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('tab', { name: 'Roles' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('tab', { name: 'Users' })).not.toHaveAttribute('aria-current');
  });
});
