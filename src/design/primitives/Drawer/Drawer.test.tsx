import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Drawer } from './Drawer';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Invite user" footer={<Button variant="primary">Send invite</Button>}>
        <Input label="Name" />
        <Input label="E-mail" />
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('moves focus in, keeps Tab inside and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Invite' });
    await user.click(trigger);

    const drawer = screen.getByRole('dialog', { name: 'Invite user' });
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(r));
    });
    expect(drawer.contains(document.activeElement)).toBe(true);

    // Close → Name → E-mail → Send invite → wraps to Close
    for (let i = 0; i < 5; i += 1) {
      await user.tab();
      expect(drawer.contains(document.activeElement)).toBe(true);
    }
    await user.tab({ shift: true });
    expect(drawer.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes with the close button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Invite' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
