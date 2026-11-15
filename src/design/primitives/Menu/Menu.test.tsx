import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../Button/Button';
import { Menu } from './Menu';

describe('Menu', () => {
  it('opens from the trigger, navigates with arrows and selects with Enter', async () => {
    const user = userEvent.setup();
    const edit = vi.fn();
    const remove = vi.fn();
    render(
      <Menu
        trigger={<Button>Actions</Button>}
        items={[
          { id: 'edit', label: 'Edit', onSelect: edit },
          { id: 'sep', separator: true },
          { id: 'remove', label: 'Remove', danger: true, onSelect: remove },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    const menu = screen.getByRole('menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(r));
    });
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

    await user.keyboard('{End}{Enter}');
    expect(remove).toHaveBeenCalledTimes(1);
    expect(edit).not.toHaveBeenCalled();
    expect(menu).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Menu trigger={<Button>More</Button>} items={[{ id: 'a', label: 'A', onSelect: () => undefined }]} />);
    const trigger = screen.getByRole('button', { name: 'More' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('follows its trigger when the page scrolls, and closes once the trigger scrolls out of sight', async () => {
    const user = userEvent.setup();
    render(<Menu trigger={<Button>Actions</Button>} items={[{ id: 'edit', label: 'Edit', onSelect: vi.fn() }]} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    const at = (top: number) => vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({ top, bottom: top + 32, left: 900, right: 932, width: 32, height: 32, x: 900, y: top, toJSON: () => ({}) });
    at(100);
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Scrolled (e.g. the page bringing the trigger into view): still open, moved with it.
    at(60);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // The trigger has left the viewport: closed.
    at(-200);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
