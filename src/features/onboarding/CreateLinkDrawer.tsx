import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAirports } from '@/api/airports';
import { errorMessage, errorRequestId } from '@/api/client';
import { useCreateOnboardingLink } from '@/api/onboarding';
import { type CreatedOnboardingLink } from '@/api/onboarding.types';
import { Icon } from '@/design/icons';
import { Banner, Button, Drawer, Input, KeyValue, Radio, RadioGroup, Select, Textarea, useToast } from '@/design/primitives';
import { DiscardPrompt } from '@/design/primitives/DiscardPrompt/DiscardPrompt';
import { useDiscardGuard } from '@/design/primitives/DiscardPrompt/useDiscardGuard';
import { applyServerErrors } from '@/lib/formErrors';

import styles from './onboarding.module.css';
import { ORG_TYPE_LABEL } from './onboardingLabels';

const schema = z.object({
  orgType: z.enum(['ACO', 'AIRPORT']),
  airportId: z.string().min(1, 'Choose an airport'),
  expiresInDays: z
    .string()
    .trim()
    .min(1, 'Enter the number of days')
    .transform((v) => Number(v))
    .pipe(z.number({ error: 'Enter a whole number' }).int('Enter a whole number').min(1, 'Between 1 and 90 days').max(90, 'Between 1 and 90 days')),
  note: z.string().trim().max(500, 'Up to 500 characters'),
});

type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;
const FIELDS = ['orgType', 'airportId', 'expiresInDays', 'note'] as const;
const DEFAULTS: FormIn = { orgType: 'ACO', airportId: '', expiresInDays: '14', note: '' };

export type CreateLinkDrawerProps = { open: boolean; onClose: () => void };

/** POST /onboarding/links; the URL (with the raw token) is shown once, here, with a copy button. */
export function CreateLinkDrawer({ open, onClose }: CreateLinkDrawerProps) {
  const toast = useToast();
  const create = useCreateOnboardingLink();
  const airports = useAirports({ pageSize: 200, active: 'true', sort: 'iata' }, open);
  const [created, setCreated] = useState<CreatedOnboardingLink | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });
  const { register, handleSubmit, setError, reset, formState } = form;
  const guard = useDiscardGuard(open, formState.isDirty && !created, onClose);

  useEffect(() => {
    if (open) {
      reset(DEFAULTS);
      setCreated(null);
      setCopied(false);
    }
  }, [open, reset]);

  const airportOptions = (airports.data?.data ?? []).map((a) => ({ value: a.id, label: `${a.iata} · ${a.name}` }));

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      { orgType: values.orgType, airportId: values.airportId, expiresInDays: values.expiresInDays, ...(values.note ? { note: values.note } : {}) },
      {
        onSuccess: (link) => setCreated(link),
        onError: (e) => {
          if (!applyServerErrors(e, setError, FIELDS)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
        },
      },
    );
  });

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy; select the link and copy it manually.');
    }
  };

  const another = () => {
    reset(DEFAULTS);
    setCreated(null);
    setCopied(false);
  };

  return (
    <Drawer
      open={open}
      onClose={guard.requestClose}
      title={created ? 'Link created' : 'Create onboarding link'}
      description={created ? 'Send it to the organisation; it works once and expires on the date below.' : 'The organisation fills in the registration form; you review and approve it here.'}
      width={520}
      footer={
        guard.prompting ? (
          <DiscardPrompt onKeep={guard.keep} onDiscard={guard.discard} />
        ) : created ? (
          <>
            <Button variant="ghost" onClick={another}>
              Create another
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={guard.requestClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="create-link-form" loading={create.isPending}>
              Create link
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className={styles.created}>
          <Banner tone="warn" title="Shown only once">
            The link carries a secret token that is not stored. Copy it now; after closing this panel it cannot be retrieved.
          </Banner>
          <div className={styles.urlBox}>
            <span className={styles.url} data-testid="created-link-url">
              {created.url}
            </span>
            <Button size="sm" variant={copied ? 'secondary' : 'primary'} icon={<Icon name={copied ? 'check' : 'link'} size={16} />} onClick={() => void copy()}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <KeyValue
            columns={2}
            items={[
              { key: 'For', value: ORG_TYPE_LABEL[created.orgType] },
              { key: 'Airport', value: created.airport ? `${created.airport.iata} · ${created.airport.name}` : '—' },
              { key: 'Expires', value: new Date(created.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), mono: true },
              { key: 'Note', value: created.note ?? '—' },
            ]}
          />
        </div>
      ) : (
        <form id="create-link-form" className={styles.form} onSubmit={onSubmit} noValidate>
          <RadioGroup label="Organisation type">
            <Radio label="Operator (ACO)" description="Registers with its market share; approval creates the operator." value="ACO" {...register('orgType')} />
            <Radio label="Airport organisation" description="Reporting access for the airport itself." value="AIRPORT" {...register('orgType')} />
          </RadioGroup>
          <Select
            label="Airport"
            required
            placeholder={airports.isPending ? 'Loading airports…' : 'Choose an airport'}
            options={airportOptions}
            disabled={airports.isPending}
            hint={airports.isError ? 'Could not load airports.' : 'The organisation registers at this airport.'}
            error={formState.errors.airportId?.message}
            {...register('airportId')}
            data-autofocus
          />
          <Input label="Valid for" mono inputMode="numeric" suffix="days" required hint="1 to 90 days; 14 by default" error={formState.errors.expiresInDays?.message} {...register('expiresInDays')} />
          <Textarea label="Note" hint="Optional; for your team, not shown to the organisation" rows={2} error={formState.errors.note?.message} {...register('note')} />
          {create.isError ? (
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
      )}
    </Drawer>
  );
}
