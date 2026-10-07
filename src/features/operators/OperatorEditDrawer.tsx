import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { type Path, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAirports } from '@/api/airports';
import { errorMessage, errorRequestId } from '@/api/client';
import { type Operator } from '@/api/operators.types';
import { useUpdateOperator } from '@/api/organisations';
import { Button, Drawer, Input, Select, useToast } from '@/design/primitives';
import { DiscardPrompt } from '@/design/primitives/DiscardPrompt/DiscardPrompt';
import { useDiscardGuard } from '@/design/primitives/DiscardPrompt/useDiscardGuard';
import { applyServerErrors } from '@/lib/formErrors';

import { ADDRESS_FIELDS, addressSchema, CONTACT_FIELDS, contactSchema, EMPTY_CONTACT, errorAt, fromAddress, nested, operationsSchema, toAddress } from './operatorForm';
import { AddressFields, ContactFields, FormSection, OperationsFields } from './OperatorFormFields';
import styles from './operators.module.css';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the operator name').max(200),
  legalName: z.string().trim().max(200),
  airportId: z.string().min(1, 'Choose an airport'),
  operations: operationsSchema,
  address: addressSchema,
  contact: contactSchema,
});

type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

const FIELDS = ['name', 'legalName', 'airportId', 'operations', 'operations.domestic', ...nested('address', ADDRESS_FIELDS), ...nested('contact', CONTACT_FIELDS)];

function defaults(o: Operator): FormIn {
  return {
    name: o.name,
    legalName: o.legalName ?? '',
    airportId: o.airport.id,
    operations: { ...o.operations },
    address: fromAddress(o.address),
    contact: o.contact ? { ...o.contact } : EMPTY_CONTACT,
  };
}

export type OperatorEditDrawerProps = {
  open: boolean;
  onClose: () => void;
  operator: Operator | null;
};

/** PATCH /operators/:id — name, legal name, airport, operations, address and contact. The code never changes. */
export function OperatorEditDrawer({ open, onClose, operator }: OperatorEditDrawerProps) {
  const toast = useToast();
  const update = useUpdateOperator();
  const airports = useAirports({ pageSize: 200, sort: 'iata' }, open);

  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema), defaultValues: operator ? defaults(operator) : undefined });
  const { register, handleSubmit, setError, reset, formState } = form;
  const guard = useDiscardGuard(open, formState.isDirty, onClose);
  const reg = (name: string) => register(name as Path<FormIn>);
  const errAt = (path: string) => errorAt(formState.errors, path);

  useEffect(() => {
    if (open && operator) reset(defaults(operator));
  }, [open, operator, reset]);

  const airportOptions = (airports.data?.data ?? []).map((a) => ({ value: a.id, label: `${a.iata} · ${a.name}${a.active ? '' : ' (inactive)'}` }));

  const onSubmit = handleSubmit((values) => {
    if (!operator) return;
    update.mutate(
      {
        id: operator.id,
        name: values.name,
        legalName: values.legalName || null,
        airportId: values.airportId,
        operations: values.operations,
        address: toAddress(values.address),
        contact: values.contact,
      },
      {
        onSuccess: (op) => {
          toast.success(`${op.name} updated`);
          onClose();
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
      title={operator ? `Edit ${operator.code}` : 'Edit operator'}
      description="Changes apply at once; past cycle snapshots keep their own copy."
      width={600}
      footer={
        guard.prompting ? (
          <DiscardPrompt onKeep={guard.keep} onDiscard={guard.discard} />
        ) : (
          <>
            <Button variant="ghost" onClick={guard.requestClose} disabled={update.isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="operator-edit-form" loading={update.isPending}>
              Save changes
            </Button>
          </>
        )
      }
    >
      <form id="operator-edit-form" className={styles.form} onSubmit={onSubmit} noValidate>
        <FormSection title="Organisation">
          <Input label="Operator name" required error={errAt('name')} {...reg('name')} data-autofocus />
          <Input label="Legal name" hint="Optional; as registered" error={errAt('legalName')} {...reg('legalName')} />
          <Select
            label="Airport"
            required
            placeholder={airports.isPending ? 'Loading airports…' : 'Choose an airport'}
            options={airportOptions}
            disabled={airports.isPending}
            hint="Moving an operator does not move its market share."
            error={errAt('airportId')}
            {...reg('airportId')}
          />
          <OperationsFields prefix="operations" reg={reg} errorAt={errAt} />
        </FormSection>
        <FormSection title="Registered address">
          <AddressFields prefix="address" reg={reg} errorAt={errAt} />
        </FormSection>
        <FormSection title="Organisation contact">
          <ContactFields prefix="contact" reg={reg} errorAt={errAt} />
        </FormSection>
        {update.isError && !formState.isSubmitSuccessful ? (
          <p className={styles.errorBox} role="alert">
            {errorMessage(update.error)}
            {errorRequestId(update.error) ? (
              <>
                {' '}
                · Request <code>{errorRequestId(update.error)}</code>
              </>
            ) : null}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}
