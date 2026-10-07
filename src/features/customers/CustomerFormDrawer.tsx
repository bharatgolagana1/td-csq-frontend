import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useCreateCustomer, useUpdateCustomer } from '@/api/customers';
import { type Customer } from '@/api/customers.types';
import { Button, Dialog, Drawer, Input, Select, Tag, useToast } from '@/design/primitives';
import { applyServerErrors } from '@/lib/formErrors';

import { SURVEY_OPTIONS, TYPE_OPTIONS } from './customerLabels';
import styles from './customers.module.css';
import { formatPhone, normalisePhone } from './phone';

/** Mirrors the backend's field rules (customers/domain/normalise.ts). */
const schema = z.object({
  name: z.string().trim().min(1, 'Enter the organisation name').max(200, 'Name is longer than 200 characters'),
  contactPerson: z.string().trim().max(120, 'Contact person is longer than 120 characters'),
  email: z.string().trim().email('Enter a valid e-mail address').max(254).transform((v) => v.toLowerCase()),
  phone: z.string().superRefine((value, ctx) => {
    const result = normalisePhone(value);
    if (!result.ok) ctx.addIssue({ code: 'custom', message: result.message });
  }),
  type: z.enum(['FF', 'CB'], { message: 'Choose FF or CB' }),
  surveyType: z.enum(['DOMESTIC', 'INTERNATIONAL', 'BOTH'], { message: 'Choose a survey type' }),
  tags: z.string().max(1000),
});

type FormValues = z.input<typeof schema>;
const FIELDS = ['name', 'contactPerson', 'email', 'phone', 'type', 'surveyType', 'tags'] as const;

/** "ops; priority, delhi" → ["ops", "priority", "delhi"] (first spelling wins, case-insensitive). */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  raw.split(/[;|,]/).forEach((part) => {
    const tag = part.replace(/\s+/g, ' ').trim();
    if (!tag || seen.has(tag.toLowerCase())) return;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  });
  return tags;
}

function valuesOf(customer: Customer | null): FormValues {
  return customer
    ? { name: customer.name, contactPerson: customer.contactPerson === customer.name ? '' : customer.contactPerson, email: customer.email, phone: customer.phone, type: customer.type, surveyType: customer.surveyType, tags: customer.tags.join(', ') }
    : { name: '', contactPerson: '', email: '', phone: '', type: 'FF', surveyType: 'DOMESTIC', tags: '' };
}

export type CustomerFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Edit when given; add otherwise. */
  customer: Customer | null;
  /** PLATFORM users name the operator on create. */
  acoId: string;
  isPlatform: boolean;
};

/** Add / edit one FF / CB customer (§6 POST|PATCH /customers). Duplicate e-mail (409) lands on the field. */
export function CustomerFormDrawer({ open, onClose, customer, acoId, isPlatform }: CustomerFormDrawerProps) {
  const toast = useToast();
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const pending = create.isPending || update.isPending;
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // The page mounts this drawer only while it is open, so the form and the
  // mutations start fresh for every add / edit and no reset effect is needed.
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: valuesOf(customer) });
  const { register, handleSubmit, watch, setError, formState } = form;
  // Read during render so react-hook-form's proxy tracks it (reading it only in the close handler leaves it stale).
  const isDirty = formState.isDirty;

  const phoneRaw = watch('phone');
  const phonePreview = normalisePhone(phoneRaw ?? '');
  const tagsPreview = parseTags(watch('tags') ?? '');

  const requestClose = () => {
    if (pending) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };

  const onSubmit = handleSubmit((values) => {
    const parsed = schema.parse(values);
    const phone = normalisePhone(parsed.phone);
    const body = {
      name: parsed.name,
      contactPerson: parsed.contactPerson,
      email: parsed.email,
      phone: phone.ok ? phone.value : parsed.phone,
      type: parsed.type,
      surveyType: parsed.surveyType,
      tags: parseTags(parsed.tags),
    };
    const onError = (e: unknown) => {
      if (isApiError(e, 'CONFLICT')) {
        setError('email', { type: 'server', message: e.message });
        return;
      }
      if (!applyServerErrors(e, setError, FIELDS)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
    };
    if (customer) {
      update.mutate(
        { id: customer.id, ...body },
        {
          onSuccess: () => {
            toast.success(`${body.name} updated`);
            onClose();
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { ...body, ...(isPlatform && acoId ? { acoId } : {}) },
        {
          onSuccess: () => {
            toast.success(`${body.name} added`);
            onClose();
          },
          onError,
        },
      );
    }
  });

  const mutationError = customer ? update.error : create.error;

  return (
    <>
      <Drawer
        open={open}
        onClose={requestClose}
        title={customer ? 'Edit customer' : 'Add customer'}
        description={customer ? customer.email : 'A freight forwarder or customs broker who can be sampled for assessments.'}
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={requestClose} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="customer-form" loading={pending}>
              {customer ? 'Save changes' : 'Add customer'}
            </Button>
          </>
        }
      >
        <form id="customer-form" className={styles.form} onSubmit={onSubmit} noValidate>
          <Input label="Organisation name" required autoComplete="organization" error={formState.errors.name?.message} {...register('name')} data-autofocus />
          <Input label="Contact person" hint="Optional — the organisation name stands in when empty." autoComplete="off" error={formState.errors.contactPerson?.message} {...register('contactPerson')} />
          <Input label="E-mail" type="email" required autoComplete="off" hint="One e-mail per customer; it is the key on re-import." error={formState.errors.email?.message} {...register('email')} />
          <Input
            label="Phone"
            type="tel"
            required
            placeholder="98765 43210 or +91 …"
            mono
            hint={phoneRaw && phonePreview.ok ? `Will be saved as ${formatPhone(phonePreview.value)}` : '10-digit Indian mobile, or an international number starting with +. Spaces and dashes are fine.'}
            error={formState.errors.phone?.message}
            {...register('phone')}
          />
          <div className={styles.formRow}>
            <Select label="Stakeholder type" required options={TYPE_OPTIONS} error={formState.errors.type?.message} {...register('type')} />
            <Select label="Survey type" required options={SURVEY_OPTIONS} error={formState.errors.surveyType?.message} {...register('surveyType')} />
          </div>
          <div>
            <Input label="Tags" hint="Separate with commas or semicolons. Up to 20 tags of 40 characters." autoComplete="off" error={formState.errors.tags?.message} {...register('tags')} />
            {tagsPreview.length > 0 ? (
              <div className={styles.tagRow} aria-label="Tags preview">
                {tagsPreview.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            ) : null}
          </div>
          {mutationError && !formState.isSubmitSuccessful && !isApiError(mutationError, 'VALIDATION') && !isApiError(mutationError, 'CONFLICT') ? (
            <p className={styles.errorBox} role="alert">
              {errorMessage(mutationError)}
              {errorRequestId(mutationError) ? (
                <>
                  {' '}
                  · Request <code>{errorRequestId(mutationError)}</code>
                </>
              ) : null}
            </p>
          ) : null}
        </form>
      </Drawer>

      <Dialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard changes?"
        description="The customer form has unsaved changes."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDiscard(false)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              Discard
            </Button>
          </>
        }
      />
    </>
  );
}
