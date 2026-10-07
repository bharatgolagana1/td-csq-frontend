import { useCallback, useState } from 'react';
import { type UseFormTrigger } from 'react-hook-form';

import { type RegisterValues, STEP_FIELDS, STEPS } from './registerSchema';

/** Step index plus guarded navigation: `next` validates the current step's fields first. */
export function useRegisterStepper(trigger: UseFormTrigger<RegisterValues>, focusHeading?: () => void) {
  const [step, setStep] = useState(0);
  const last = STEPS.length - 1;

  const go = useCallback(
    (index: number) => {
      setStep(Math.max(0, Math.min(last, index)));
      focusHeading?.();
    },
    [last, focusHeading],
  );

  const next = useCallback(async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 ? true : await trigger(fields, { shouldFocus: true });
    if (valid) go(step + 1);
    return valid;
  }, [step, trigger, go]);

  const back = useCallback(() => go(step - 1), [step, go]);

  return { step, isFirst: step === 0, isLast: step === last, next, back, go };
}
