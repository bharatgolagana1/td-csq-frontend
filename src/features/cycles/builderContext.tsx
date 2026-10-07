import { createContext, type ReactNode, useContext } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { type Airport } from '@/api/airports.types';
import { type CycleDetail } from '@/api/cycles.types';
import { type Operator } from '@/api/operators.types';
import { type Settings } from '@/api/types';

import { type BuilderStepId, type BuilderValues } from './builderSchema';

/* Feature-local context so the five steps share one form and the reference
   data without prop drilling (ARCHITECTURE §1a). */

export type BuilderCtx = {
  form: UseFormReturn<BuilderValues>;
  settings: Settings | undefined;
  /** The draft being edited; null for a new cycle. */
  cycle: CycleDetail | null;
  step: BuilderStepId;
  goTo: (step: BuilderStepId) => void;
  airports: Airport[];
  operators: Operator[];
  referenceLoading: boolean;
  referenceError: unknown;
};

const Ctx = createContext<BuilderCtx | null>(null);

export function BuilderProvider({ value, children }: { value: BuilderCtx; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBuilder(): BuilderCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBuilder must be used inside <BuilderProvider>');
  return ctx;
}
