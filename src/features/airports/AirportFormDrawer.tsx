import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateAirport, useUpdateAirport } from '@/api/airports';
import { type Airport, type Region, REGIONS } from '@/api/airports.types';
import { errorMessage, errorRequestId } from '@/api/client';
import { Button, Checkbox, Drawer, Input, Select, useToast } from '@/design/primitives';
import { DiscardPrompt } from '@/design/primitives/DiscardPrompt/DiscardPrompt';
import { useDiscardGuard } from '@/design/primitives/DiscardPrompt/useDiscardGuard';
import { applyServerErrors } from '@/lib/formErrors';

import { REGION_OPTIONS } from './airportLabels';
import styles from './airports.module.css';

const coordinate = (limit: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}`)
    .transform((v) => Number(v))
    .pipe(z.number({ error: 'Enter a number' }).min(-limit, `${label} is between -${limit} and ${limit}`).max(limit, `${label} is between -${limit} and ${limit}`));

const schema = z.object({
  iata: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Three letters, e.g. DEL'),
  icao: z.string().trim().toUpperCase().regex(/^([A-Z0-9]{4})?$/, 'Four characters, e.g. VIDP'),
  name: z.string().trim().min(1, 'Enter the airport name').max(200),
  city: z.string().trim().min(1, 'Enter the city').max(120),
  state: z.string().trim().min(1, 'Enter the state').max(120),
  region: z.enum(REGIONS).or(z.literal('')),
  lat: coordinate(90, 'Latitude'),
  lng: coordinate(180, 'Longitude'),
  active: z.boolean(),
});

type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;
const FIELDS = ['iata', 'icao', 'name', 'city', 'state', 'region', 'lat', 'lng', 'active'] as const;

function defaults(airport: Airport | null): FormIn {
  return airport
    ? { iata: airport.iata, icao: airport.icao ?? '', name: airport.name, city: airport.city, state: airport.state, region: airport.region as Region, lat: String(airport.lat), lng: String(airport.lng), active: airport.active }
    : { iata: '', icao: '', name: '', city: '', state: '', region: '', lat: '', lng: '', active: true };
}

export type AirportFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Edit when given; create otherwise. */
  airport?: Airport | null;
};

/** Create / edit an airport (§6 POST, PATCH /airports). The IATA code is fixed once created. */
export function AirportFormDrawer({ open, onClose, airport = null }: AirportFormDrawerProps) {
  const toast = useToast();
  const create = useCreateAirport();
  const update = useUpdateAirport();
  const pending = create.isPending || update.isPending;
  const editing = airport !== null;

  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema), defaultValues: defaults(airport) });
  const { register, handleSubmit, setError, reset, formState } = form;
  const guard = useDiscardGuard(open, formState.isDirty, onClose);

  useEffect(() => {
    if (open) reset(defaults(airport));
  }, [open, airport, reset]);

  const onSubmit = handleSubmit((values) => {
    const common = { icao: values.icao || null, name: values.name, city: values.city, state: values.state, lat: values.lat, lng: values.lng, active: values.active, ...(values.region ? { region: values.region } : {}) };
    const done = (name: string) => {
      toast.success(editing ? `${name} updated` : `${name} added`);
      onClose();
    };
    const fail = (e: unknown) => {
      if (!applyServerErrors(e, setError, FIELDS)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
    };
    if (editing) update.mutate({ id: airport.id, ...common }, { onSuccess: (a) => done(a.name), onError: fail });
    else create.mutate({ iata: values.iata, ...common }, { onSuccess: (a) => done(a.name), onError: fail });
  });

  const mutation = editing ? update : create;

  return (
    <Drawer
      open={open}
      onClose={guard.requestClose}
      title={editing ? `Edit ${airport.iata}` : 'Add airport'}
      description={editing ? 'Changes apply to every cycle and report that names this airport.' : 'Airports are inactive until marked active; operators can only be tagged to active airports.'}
      width={520}
      footer={
        guard.prompting ? (
          <DiscardPrompt onKeep={guard.keep} onDiscard={guard.discard} />
        ) : (
          <>
            <Button variant="ghost" onClick={guard.requestClose} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="airport-form" loading={pending}>
              {editing ? 'Save changes' : 'Add airport'}
            </Button>
          </>
        )
      }
    >
      <form id="airport-form" className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.formRow}>
          <Input label="IATA code" mono required maxLength={3} placeholder="DEL" disabled={editing} hint={editing ? 'Cannot change once created' : undefined} error={formState.errors.iata?.message} {...register('iata')} data-autofocus={!editing || undefined} />
          <Input label="ICAO code" mono maxLength={4} placeholder="VIDP" hint="Optional" error={formState.errors.icao?.message} {...register('icao')} />
        </div>
        <Input label="Airport name" required error={formState.errors.name?.message} {...register('name')} data-autofocus={editing || undefined} />
        <div className={styles.formRow}>
          <Input label="City" required error={formState.errors.city?.message} {...register('city')} />
          <Input label="State" required error={formState.errors.state?.message} {...register('state')} />
        </div>
        <Select label="Region" options={REGION_OPTIONS} placeholder="Derive from the state" hint="Leave blank to derive from the state" error={formState.errors.region?.message} {...register('region')} />
        <div className={styles.formRow}>
          <Input label="Latitude" mono required inputMode="decimal" placeholder="28.5562" error={formState.errors.lat?.message} {...register('lat')} />
          <Input label="Longitude" mono required inputMode="decimal" placeholder="77.1000" error={formState.errors.lng?.message} {...register('lng')} />
        </div>
        <Checkbox label="Active" description="Active airports can take part in cycles and appear in reports." {...register('active')} />
        {mutation.isError && !formState.isSubmitSuccessful ? (
          <p className={styles.errorBox} role="alert">
            {errorMessage(mutation.error)}
            {errorRequestId(mutation.error) ? (
              <>
                {' '}
                · Request <code>{errorRequestId(mutation.error)}</code>
              </>
            ) : null}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}
