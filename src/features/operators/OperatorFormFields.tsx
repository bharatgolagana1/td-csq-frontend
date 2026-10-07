import { type ReactNode } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

import { Checkbox, Input } from '@/design/primitives';

import styles from './operators.module.css';

/* Field groups shared by the create and edit drawers. `reg` wraps the form's
   `register` with a plain string name so the groups stay generic. */

export type FieldReg = (name: string) => UseFormRegisterReturn;
export type ErrorAt = (path: string) => string | undefined;

type GroupProps = { prefix: string; reg: FieldReg; errorAt: ErrorAt };

export function FormSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AddressFields({ prefix, reg, errorAt }: GroupProps) {
  return (
    <>
      <Input label="Address line 1" required autoComplete="off" error={errorAt(`${prefix}.line1`)} {...reg(`${prefix}.line1`)} />
      <Input label="Address line 2" hint="Optional" autoComplete="off" error={errorAt(`${prefix}.line2`)} {...reg(`${prefix}.line2`)} />
      <div className={styles.formRow}>
        <Input label="City" required error={errorAt(`${prefix}.city`)} {...reg(`${prefix}.city`)} />
        <Input label="State" required error={errorAt(`${prefix}.state`)} {...reg(`${prefix}.state`)} />
      </div>
      <Input label="PIN code" required mono inputMode="numeric" maxLength={6} placeholder="110037" error={errorAt(`${prefix}.pincode`)} {...reg(`${prefix}.pincode`)} />
    </>
  );
}

export function ContactFields({ prefix, reg, errorAt }: GroupProps) {
  return (
    <>
      <div className={styles.formRow}>
        <Input label="Name" required autoComplete="off" error={errorAt(`${prefix}.name`)} {...reg(`${prefix}.name`)} />
        <Input label="Phone" type="tel" required placeholder="+91 …" error={errorAt(`${prefix}.phone`)} {...reg(`${prefix}.phone`)} />
      </div>
      <Input label="E-mail" type="email" required autoComplete="off" error={errorAt(`${prefix}.email`)} {...reg(`${prefix}.email`)} />
    </>
  );
}

export function OperationsFields({ prefix, reg, errorAt }: GroupProps) {
  const error = errorAt(`${prefix}.domestic`);
  return (
    <div className={styles.checks} role="group" aria-label="Operations">
      <span className={styles.fieldLabel}>Operations</span>
      <Checkbox label="Domestic cargo" {...reg(`${prefix}.domestic`)} />
      <Checkbox label="International cargo" {...reg(`${prefix}.international`)} />
      {error ? (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
