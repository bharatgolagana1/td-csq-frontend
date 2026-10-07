import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { type Path, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAirports } from '@/api/airports';
import { errorMessage, errorRequestId } from '@/api/client';
import { type Operator } from '@/api/operators.types';
import { useCreateOperator } from '@/api/organisations';
import { Button, Drawer, Input, Select, useToast } from '@/design/primitives';
import { DiscardPrompt } from '@/design/primitives/DiscardPrompt/DiscardPrompt';
import { useDiscardGuard } from '@/design/primitives/DiscardPrompt/useDiscardGuard';
import { applyServerErrors } from '@/lib/formErrors';

import { ADDRESS_FIELDS, addressSchema, codeSchema, CONTACT_FIELDS, contactSchema, EMPTY_ADDRESS, EMPTY_CONTACT, errorAt, nested, operationsSchema, sharePctSchema, toAddress } from './operatorForm';
import { AddressFields, ContactFields, FormSection, OperationsFields } from './OperatorFormFields';
import styles from './operators.module.css';

const schema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1, 'Enter the operator name').max(200),
  legalName: z.string().trim().max(200),
  airportId: z.string().min(1, 'Choose an airport'),
  operations: operationsSchema,
  address: addressSchema,
  contact: contactSchema,
  admin: contactSchema,
  marketSharePct: sharePctSchema,
});

type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

const DEFAULTS: FormIn = {
  code: '',
  name: '',
  legalName: '',
  airportId: '',
  operations: { domestic: true, international: false },
  address: EMPTY_ADDRESS,
  contact: EMPTY_CONTACT,
  admin: EMPTY_CONTACT,
  marketSharePct: '',
};

const FIELDS = ['code', 'name', 'legalName', 'airportId', 'operations', 'operations.domestic', 'marketSharePct', ...nested('address', ADDRESS_FIELDS), ...nested('contact', CONTACT_FIELDS), ...nested('admin', CONTACT_FIELDS)];

export type OperatorCreateDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (operator: Operator) => void;
};

/** POST /operators: the organisation, its registered address and contact, the first admin and an optional current share. */
export function OperatorCreateDrawer({ open, onClose, onCreated }: OperatorCreateDrawerProps) {
  const toast = useToast();
  const create = useCreateOperator();
  const airports = useAirports({ pageSize: 200, active: 'true', sort: 'iata' }, open);

  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });
  const { register, handleSubmit, setError, reset, getValues, setValue, formState } = form;
  const guard = useDiscardGuard(open, formState.isDirty, onClose);
  const reg = (name: string) => register(name as Path<FormIn>);
  const errAt = (path: string) => errorAt(formState.errors, path);

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const airportOptions = (airports.data?.data ?? []).map((a) => ({ value: a.id, label: `${a.iata} · ${a.name}` }));

  const copyContact = () => {
    const c = getValues('contact');
    setValue('admin', { ...c }, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      {
        code: values.code,
        name: values.name,
        ...(values.legalName ? { legalName: values.legalName } : {}),
        airportId: values.airportId,
        operations: values.operations,
        address: toAddress(values.address),
        contact: values.contact,
        admin: values.admin,
        ...(values.marketSharePct !== undefined ? { marketSharePct: values.marketSharePct } : {}),
      },
      {
        onSuccess: (op) => {
          toast.success(`${op.name} created`, { description: `Invitation sent to ${values.admin.email}` });
          onClose();
          onCreated?.(op);
        },
        onError: (e) => {
          if (!applyServerErrors(e, setError, FIELDS)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
        },
      },
    );
  });

  return (
    <Drawer
      open={open}
      onClose={guard.requestClose}
      title="Add operator"
      description="Creates the organisation as active and invites its administrator by e-mail."
      width={640}
      footer={
        guard.prompting ? (
          <DiscardPrompt onKeep={guard.keep} onDiscard={guard.discard} />
        ) : (
          <>
            <Button variant="ghost" onClick={guard.requestClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="operator-create-form" loading={create.isPending}>
              Create operator
            </Button>
          </>
        )
      }
    >
      <form id="operator-create-form" className={styles.form} onSubmit={onSubmit} noValidate>
        <FormSection title="Organisation">
          <div className={styles.formRow}>
            <Input label="Code" required mono maxLength={20} placeholder="CSC-DEL" hint="Unique; used in reports" error={errAt('code')} {...reg('code')} data-autofocus />
            <Select
              label="Airport"
              required
              placeholder={airports.isPending ? 'Loading airports…' : 'Choose an airport'}
              options={airportOptions}
              disabled={airports.isPending}
              hint={airports.isError ? 'Could not load airports.' : undefined}
              error={errAt('airportId')}
              {...reg('airportId')}
            />
          </div>
          <Input label="Operator name" required error={errAt('name')} {...reg('name')} />
          <Input label="Legal name" hint="Optional; as registered" error={errAt('legalName')} {...reg('legalName')} />
          <OperationsFields prefix="operations" reg={reg} errorAt={errAt} />
        </FormSection>

        <FormSection title="Registered address">
          <AddressFields prefix="address" reg={reg} errorAt={errAt} />
        </FormSection>

        <FormSection title="Organisation contact">
          <ContactFields prefix="contact" reg={reg} errorAt={errAt} />
        </FormSection>

        <FormSection
          title="Administrator"
          action={
            <Button size="sm" variant="ghost" onClick={copyContact}>
              Same as contact
            </Button>
          }
        >
          <ContactFields prefix="admin" reg={reg} errorAt={errAt} />
        </FormSection>

        <FormSection title="Market share">
          <Input
            label="Current share at the airport"
            mono
            inputMode="decimal"
            suffix="%"
            placeholder="0–100"
            hint="Optional. Shares at an airport must total 100 before a cycle there can be published."
            error={errAt('marketSharePct')}
            {...reg('marketSharePct')}
          />
        </FormSection>

        {create.isError && !formState.isSubmitSuccessful ? (
          <p className={styles.errorBox} role="alert">
            {errorMessage(create.error)}
            {errorRequestId(create.error) ? (
              <>
                {' '}
                · Request <code>{errorRequestId(create.error)}</code>
              </>
            ) : null}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}
