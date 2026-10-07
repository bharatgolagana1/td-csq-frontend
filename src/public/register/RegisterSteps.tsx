import { type UseFormReturn } from 'react-hook-form';

import { type LinkOrgType } from '@/api/onboarding.types';
import { Button, Checkbox, Input } from '@/design/primitives';

import styles from './register.module.css';
import { type RegisterOutput, type RegisterValues } from './registerSchema';

type Form = UseFormReturn<RegisterValues, unknown, RegisterOutput>;

export function StepOrganisation({ form, orgType }: { form: Form; orgType: LinkOrgType }) {
  const { register, formState } = form;
  const e = formState.errors;
  return (
    <>
      <Input label="Organisation name" size="lg" required autoComplete="organization" error={e.organisation?.name?.message} {...register('organisation.name')} data-autofocus />
      <Input label="Legal name" size="lg" hint="Optional; as registered, if different" error={e.organisation?.legalName?.message} {...register('organisation.legalName')} />
      <div className={styles.group} role="group" aria-label="Operations">
        <span className={styles.groupLabel}>Operations</span>
        <Checkbox label="Domestic cargo" {...register('operations.domestic')} />
        <Checkbox label="International cargo" {...register('operations.international')} />
        {e.operations?.domestic?.message ? (
          <p className={styles.fieldError} role="alert">
            {e.operations.domestic.message}
          </p>
        ) : null}
      </div>
      {orgType === 'ACO' ? (
        <Input
          label="Market share at the airport"
          size="lg"
          mono
          inputMode="decimal"
          suffix="%"
          placeholder="0–100"
          hint="Optional. Your approximate share of cargo handled at the airport; ACFI confirms it on approval."
          error={e.marketSharePct?.message}
          {...register('marketSharePct')}
        />
      ) : null}
    </>
  );
}

export function StepAddress({ form }: { form: Form }) {
  const { register, formState } = form;
  const a = formState.errors.organisation?.address;
  const c = formState.errors.organisation?.contact;
  return (
    <>
      <h3 className={styles.subhead}>Registered address</h3>
      <Input label="Address line 1" size="lg" required autoComplete="address-line1" error={a?.line1?.message} {...register('organisation.address.line1')} data-autofocus />
      <Input label="Address line 2" size="lg" hint="Optional" autoComplete="address-line2" error={a?.line2?.message} {...register('organisation.address.line2')} />
      <div className={styles.row}>
        <Input label="City" size="lg" required autoComplete="address-level2" error={a?.city?.message} {...register('organisation.address.city')} />
        <Input label="State" size="lg" required autoComplete="address-level1" error={a?.state?.message} {...register('organisation.address.state')} />
      </div>
      <Input label="PIN code" size="lg" required mono inputMode="numeric" maxLength={6} autoComplete="postal-code" error={a?.pincode?.message} {...register('organisation.address.pincode')} />
      <h3 className={styles.subhead}>Organisation contact</h3>
      <Input label="Contact person" size="lg" required autoComplete="name" error={c?.name?.message} {...register('organisation.contact.name')} />
      <div className={styles.row}>
        <Input label="E-mail" size="lg" type="email" required autoComplete="email" error={c?.email?.message} {...register('organisation.contact.email')} />
        <Input label="Phone" size="lg" type="tel" required autoComplete="tel" placeholder="+91 …" error={c?.phone?.message} {...register('organisation.contact.phone')} />
      </div>
    </>
  );
}

export function StepAdmin({ form }: { form: Form }) {
  const { register, formState, getValues, setValue } = form;
  const e = formState.errors.admin;
  const copy = () => {
    const c = getValues('organisation.contact');
    setValue('admin', { ...c }, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  return (
    <>
      <p className={styles.stepLead}>The administrator receives the sign-in invitation once ACFI approves the request and manages the organisation’s users.</p>
      <div className={styles.subheadRow}>
        <h3 className={styles.subhead}>Administrator</h3>
        <Button size="sm" variant="ghost" onClick={copy}>
          Same as contact
        </Button>
      </div>
      <Input label="Full name" size="lg" required autoComplete="off" error={e?.name?.message} {...register('admin.name')} data-autofocus />
      <Input label="E-mail" size="lg" type="email" required autoComplete="off" hint="The invitation is sent here" error={e?.email?.message} {...register('admin.email')} />
      <Input label="Mobile" size="lg" type="tel" required autoComplete="off" placeholder="+91 …" error={e?.phone?.message} {...register('admin.phone')} />
    </>
  );
}
