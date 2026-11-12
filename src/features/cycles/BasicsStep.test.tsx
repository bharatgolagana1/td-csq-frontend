import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { type CycleDetail } from '@/api/cycles.types';

import { BasicsStep } from './BasicsStep';
import { BuilderProvider } from './builderContext';
import { builderSchema, type BuilderValues, defaultBuilderValues, toPatchInput, valuesFromCycle } from './builderSchema';
import { cycleDetail } from './fixtures';

function Basics({ cycle }: { cycle: CycleDetail | null }) {
  const form = useForm<BuilderValues>({ resolver: zodResolver(builderSchema), defaultValues: cycle ? valuesFromCycle(cycle) : defaultBuilderValues() });
  return (
    <BuilderProvider value={{ form, settings: undefined, cycle, step: 'basics', goTo: () => undefined, airports: [], operators: [], referenceLoading: false, referenceError: null }}>
      <BasicsStep />
    </BuilderProvider>
  );
}

describe('BasicsStep · answer mode', () => {
  it('offers both modes on a draft', () => {
    render(<Basics cycle={cycleDetail({ answerMode: 'SINGLE' }, 'DRAFT')} />);
    const modes = screen.getByRole('radiogroup', { name: 'Answer mode' });
    expect(within(modes).getByRole('radio', { name: /Single rating/ })).toBeChecked();
    within(modes).getAllByRole('radio').forEach((r) => expect(r).toBeEnabled());
    expect(screen.queryByText('Fixed once the cycle is published.')).toBeNull();
  });

  it('shows the mode of a published cycle disabled, with a note, and never sends it again', () => {
    const published = cycleDetail({ answerMode: 'SINGLE' }, 'SAMPLING_OPEN');
    render(<Basics cycle={published} />);
    const modes = screen.getByRole('radiogroup', { name: 'Answer mode' });
    expect(within(modes).getByRole('radio', { name: /Single rating/ })).toBeChecked();
    expect(within(modes).getByRole('radio', { name: /Import & Export/ })).not.toBeChecked();
    within(modes).getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
    expect(screen.getByText('Fixed once the cycle is published.')).toBeInTheDocument();

    const values = valuesFromCycle(published);
    expect(toPatchInput(values, 'SAMPLING_OPEN')).not.toHaveProperty('answerMode');
    expect(toPatchInput(values, 'DRAFT')).toHaveProperty('answerMode', 'SINGLE');
  });
});
