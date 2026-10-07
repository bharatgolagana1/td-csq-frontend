import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { errorMessage, errorRequestId } from '@/api/client';
import { useInviteUser, useRoles } from '@/api/identity';
import { type Operator } from '@/api/operators.types';
import { organisationKeys } from '@/api/organisations';
import { Button, Drawer, Input, Select, useToast } from '@/design/primitives';
import { DiscardPrompt } from '@/design/primitives/DiscardPrompt/DiscardPrompt';
import { useDiscardGuard } from '@/design/primitives/DiscardPrompt/useDiscardGuard';
import { applyServerErrors } from '@/lib/formErrors';

import styles from './operators.module.css';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the person’s name'),
  email: z
    .string()
    .trim()
    .email('Enter a valid e-mail address')
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9][0-9 \-()]{6,19})?$/, 'Enter a valid phone number'),
  roleCode: z.string().min(1, 'Choose a role'),
});

type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;
const FIELDS = ['name', 'email', 'phone', 'roleCode'] as const;
const DEFAULTS: FormIn = { name: '', email: '', phone: '', roleCode: '' };

export type InviteMemberDrawerProps = { open: boolean; onClose: () => void; operator: Operator };

/** The Users area's invite pattern with the organisation fixed to this operator (POST /users, ACO roles only). */
export function InviteMemberDrawer({ open, onClose, operator }: InviteMemberDrawerProps) {
  const toast = useToast();
  const qc = useQueryClient();
  const invite = useInviteUser();
  const roles = useRoles();
  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });
  const { register, handleSubmit, setError, reset, formState } = form;
  const guard = useDiscardGuard(open, formState.isDirty, onClose);

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const roleOptions = useMemo(() => (roles.data ?? []).filter((r) => r.scope === 'ACO').map((r) => ({ value: r.code, label: r.name })), [roles.data]);

  const onSubmit = handleSubmit((values) => {
    invite.mutate(
      { name: values.name, email: values.email, orgId: operator.id, roleCode: values.roleCode, ...(values.phone ? { phone: values.phone } : {}) },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${values.email}`);
          void qc.invalidateQueries({ queryKey: organisationKeys.operators });
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
      title="Invite member"
      description={`They join ${operator.name} and receive an e-mail with a link to set their password.`}
      width={520}
      footer={
        guard.prompting ? (
          <DiscardPrompt onKeep={guard.keep} onDiscard={guard.discard} />
        ) : (
          <>
            <Button variant="ghost" onClick={guard.requestClose} disabled={invite.isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="invite-member-form" loading={invite.isPending}>
              Send invitation
            </Button>
          </>
        )
      }
    >
      <form id="invite-member-form" className={styles.section} onSubmit={onSubmit} noValidate>
        <Input label="Full name" autoComplete="off" required error={formState.errors.name?.message} {...register('name')} data-autofocus />
        <Input label="E-mail" type="email" autoComplete="off" required error={formState.errors.email?.message} {...register('email')} />
        <Input label="Phone" type="tel" placeholder="+91 …" hint="Optional" error={formState.errors.phone?.message} {...register('phone')} />
        <Select
          label="Role"
          required
          placeholder={roles.isPending ? 'Loading roles…' : 'Choose a role'}
          options={roleOptions}
          disabled={roles.isPending || roleOptions.length === 0}
          hint={roleOptions.length === 0 && !roles.isPending ? 'No operator roles exist yet.' : undefined}
          error={formState.errors.roleCode?.message}
          {...register('roleCode')}
        />
      </form>
    </Drawer>
  );
}
