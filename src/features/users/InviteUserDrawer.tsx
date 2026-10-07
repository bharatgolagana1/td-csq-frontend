import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { errorMessage, errorRequestId } from '@/api/client';
import { useInviteUser, useRoles } from '@/api/identity';
import { useOperators } from '@/api/organisations';
import { type OrgType, type RoleScope } from '@/api/types';
import { useSession } from '@/auth/session';
import { Button, Drawer, Input, Select, useToast } from '@/design/primitives';
import { applyServerErrors } from '@/lib/formErrors';

import styles from './users.module.css';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the person’s name'),
  email: z.string().trim().email('Enter a valid e-mail address').transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9][0-9 \-()]{6,19})?$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  orgId: z.string().min(1, 'Choose an organisation'),
  roleCode: z.string().min(1, 'Choose a role'),
});

type FormValues = z.input<typeof schema>;
const FIELDS = ['name', 'email', 'phone', 'orgId', 'roleCode'] as const;

function scopeFor(orgType: OrgType): RoleScope {
  return orgType === 'ACFI' ? 'PLATFORM' : orgType;
}

export type InviteUserDrawerProps = { open: boolean; onClose: () => void };

/** Invite user: name, e-mail, phone, organisation, role (§6 POST /users). */
export function InviteUserDrawer({ open, onClose }: InviteUserDrawerProps) {
  const toast = useToast();
  const { org, memberships, hasTask } = useSession();
  const invite = useInviteUser();
  const roles = useRoles();
  const operators = useOperators({ pageSize: 200, status: 'ACTIVE' }, open && hasTask('operators.view'));

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', orgId: org.id, roleCode: '' },
  });
  const { register, handleSubmit, watch, setError, reset, formState } = form;

  useEffect(() => {
    if (open) reset({ name: '', email: '', phone: '', orgId: org.id, roleCode: '' });
  }, [open, org.id, reset]);

  // Organisations: own memberships plus (for platform users) every active operator.
  const orgOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; type: OrgType }>();
    memberships.forEach((m) => map.set(m.orgId, { value: m.orgId, label: m.orgName, type: m.orgType }));
    operators.data?.data.forEach((o) => map.set(o.id, { value: o.id, label: `${o.name} · ${o.airport.iata}`, type: 'ACO' }));
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [memberships, operators.data]);

  const orgId = watch('orgId');
  const orgType = orgOptions.find((o) => o.value === orgId)?.type ?? org.type;
  const roleOptions = useMemo(
    () => (roles.data ?? []).filter((r) => r.scope === scopeFor(orgType)).map((r) => ({ value: r.code, label: r.name })),
    [roles.data, orgType],
  );

  const onSubmit = handleSubmit((values) => {
    const input = { name: values.name, email: values.email, orgId: values.orgId, roleCode: values.roleCode, ...(values.phone ? { phone: values.phone } : {}) };
    invite.mutate(input, {
      onSuccess: () => {
        toast.success(`Invitation sent to ${values.email}`);
        onClose();
      },
      onError: (e) => {
        if (!applyServerErrors(e, setError, FIELDS)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
      },
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Invite user"
      description="They receive an e-mail with a link to set their password."
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={invite.isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="invite-user-form" loading={invite.isPending}>
            Send invitation
          </Button>
        </>
      }
    >
      <form id="invite-user-form" className={styles.form} onSubmit={onSubmit} noValidate>
        <Input label="Full name" autoComplete="off" required error={formState.errors.name?.message} {...register('name')} data-autofocus />
        <Input label="E-mail" type="email" autoComplete="off" required error={formState.errors.email?.message} {...register('email')} />
        <Input label="Phone" type="tel" placeholder="+91 …" hint="Optional" error={formState.errors.phone?.message} {...register('phone')} />
        <Select label="Organisation" required options={orgOptions} error={formState.errors.orgId?.message} {...register('orgId')} />
        <Select
          label="Role"
          required
          placeholder={roles.isPending ? 'Loading roles…' : 'Choose a role'}
          options={roleOptions}
          disabled={roles.isPending || roleOptions.length === 0}
          hint={roleOptions.length === 0 && !roles.isPending ? 'No roles exist for this organisation type.' : undefined}
          error={formState.errors.roleCode?.message}
          {...register('roleCode')}
        />
        {invite.isError && !formState.isSubmitSuccessful ? (
          <p className={styles.errorBox} role="alert">
            {errorMessage(invite.error)}
            {errorRequestId(invite.error) ? (
              <>
                {' '}
                · Request <code>{errorRequestId(invite.error)}</code>
              </>
            ) : null}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}
