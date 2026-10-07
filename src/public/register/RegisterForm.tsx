import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useSubmitRegistration } from '@/api/onboarding';
import { type PublicOnboardingLink } from '@/api/onboarding.types';
import { Button, Progress, Stepper } from '@/design/primitives';
import { applyServerErrors } from '@/lib/formErrors';
import { formatDate } from '@/lib/format';

import styles from './register.module.css';
import { ALL_FIELDS, EMPTY_VALUES, type RegisterOutput, type RegisterValues, registerSchema, stepForField, STEPS, toRegistrationInput } from './registerSchema';
import { StepAddress, StepAdmin, StepOrganisation } from './RegisterSteps';
import { StepReview } from './StepReview';
import { useRegisterStepper } from './useRegisterStepper';

export type RegisterFormProps = {
  token: string;
  link: PublicOnboardingLink;
  onSubmitted: (result: { registrationId: string; orgName: string; adminEmail: string }) => void;
  /** 409: the link was used meanwhile; 410: it expired while the form was open. */
  onLinkGone: (reason: 'used' | 'expired') => void;
  onStepChange?: (step: number) => void;
};

const ORG_LABEL = { ACO: 'an airport cargo operator', AIRPORT: 'an airport organisation' } as const;

/** Organisation → Address & contact → Administrator → Review, validated step by step; one POST at the end. */
export function RegisterForm({ token, link, onSubmitted, onLinkGone, onStepChange }: RegisterFormProps) {
  const submit = useSubmitRegistration(token);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useForm<RegisterValues, unknown, RegisterOutput>({ resolver: zodResolver(registerSchema), defaultValues: EMPTY_VALUES, mode: 'onTouched' });
  const { handleSubmit, trigger, setError, watch, formState } = form;

  const focusHeading = useCallback(() => {
    window.requestAnimationFrame(() => heading.current?.focus());
  }, []);
  const stepper = useRegisterStepper(trigger, focusHeading);
  const goTo = (i: number) => {
    stepper.go(i);
    onStepChange?.(i);
  };
  const next = async () => {
    if (await stepper.next()) onStepChange?.(stepper.step + 1);
  };
  const back = () => {
    stepper.back();
    onStepChange?.(stepper.step - 1);
  };

  const onSubmit = handleSubmit((values) => {
    submit.mutate(toRegistrationInput(values, link.orgType), {
      onSuccess: ({ registrationId }) => onSubmitted({ registrationId, orgName: values.organisation.name, adminEmail: values.admin.email }),
      onError: (e) => {
        if (isApiError(e, 'CONFLICT')) return onLinkGone('used');
        if (isApiError(e, 'LINK_EXPIRED') || (isApiError(e) && e.status === 410)) return onLinkGone('expired');
        if (applyServerErrors(e, setError, ALL_FIELDS)) {
          const first = ALL_FIELDS.find((f) => f.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), formState.errors) !== undefined);
          if (first) goTo(stepForField(first));
        }
      },
    });
  });

  const current = STEPS[stepper.step] ?? STEPS[0];
  const values = watch();

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <p className={styles.eyebrow}>Register your organisation</p>
      <h1 className={styles.title}>{link.airport ? `${link.airport.name} (${link.airport.iata})` : 'CSQ registration'}</h1>
      <p className={styles.lead}>You are registering as {ORG_LABEL[link.orgType]}. ACFI reviews every request before access is granted.</p>
      <ul className={styles.meta}>
        <li>
          Link valid until <b>{formatDate(link.expiresAt)}</b>
        </li>
      </ul>

      <Stepper steps={STEPS.map((s) => ({ id: s.id, label: s.label, description: s.description }))} current={stepper.step} onStepClick={goTo} className={styles.stepperDesktop} />
      <div className={styles.stepperMobile}>
        <Progress value={((stepper.step + 1) / STEPS.length) * 100} label={current.label} caption={`${stepper.step + 1} of ${STEPS.length}`} size="sm" />
      </div>

      <h2 ref={heading} tabIndex={-1} className={styles.stepTitle}>
        {current.label}
      </h2>
      <div className={styles.form} key={current.id}>
        {stepper.step === 0 ? <StepOrganisation form={form} orgType={link.orgType} /> : null}
        {stepper.step === 1 ? <StepAddress form={form} /> : null}
        {stepper.step === 2 ? <StepAdmin form={form} /> : null}
        {stepper.step === 3 ? <StepReview values={values} link={link} orgType={link.orgType} onEdit={goTo} /> : null}
        {submit.isError && !isApiError(submit.error, 'VALIDATION') ? (
          <p className={styles.errorBox} role="alert">
            {errorMessage(submit.error)}
            {errorRequestId(submit.error) ? (
              <>
                {' '}
                · Request <code>{errorRequestId(submit.error)}</code>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className={styles.nav}>
        {stepper.isFirst ? (
          <span />
        ) : (
          <Button size="lg" variant="ghost" onClick={back} disabled={submit.isPending}>
            Back
          </Button>
        )}
        {/* Distinct keys: if React reused one <button>, the step change inside the Continue
            click would turn it into type="submit" before the browser runs the click's
            default action and submit the form from the Administrator step. */}
        {stepper.isLast ? (
          <Button key="submit" size="lg" variant="primary" type="submit" loading={submit.isPending}>
            Submit registration
          </Button>
        ) : (
          <Button
            key="continue"
            size="lg"
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              void next();
            }}
          >
            Continue
          </Button>
        )}
      </div>
    </form>
  );
}
