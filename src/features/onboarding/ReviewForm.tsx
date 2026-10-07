import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { errorMessage, errorRequestId } from '@/api/client';
import { useApproveRegistration, useRejectRegistration } from '@/api/onboarding';
import { type RegistrationDetail } from '@/api/onboarding.types';
import { Button, Input, Textarea, useToast } from '@/design/primitives';
import { applyServerErrors } from '@/lib/formErrors';

import styles from './onboarding.module.css';

const schema = z
  .object({
    mode: z.enum(['approve', 'reject']),
    code: z.string().trim().toUpperCase(),
    marketSharePct: z.string().trim(),
    note: z.string().trim().max(500, 'Up to 500 characters'),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'approve') {
      if (!/^[A-Z][A-Z0-9_-]{1,19}$/.test(v.code)) ctx.addIssue({ code: 'custom', path: ['code'], message: '2–20 characters: letters, digits, _ or -; starts with a letter' });
      if (v.marketSharePct !== '') {
        const n = Number(v.marketSharePct);
        if (!Number.isFinite(n) || n < 0 || n > 100) ctx.addIssue({ code: 'custom', path: ['marketSharePct'], message: 'Between 0 and 100' });
      }
    } else if (v.note.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'Tell the applicant why' });
    }
  });

type FormValues = z.input<typeof schema>;
const FIELDS = ['code', 'marketSharePct', 'note'] as const;

/** A code suggestion from the name: "Cargo Service Center" at DEL → "CSC-DEL". */
export function suggestCode(name: string, iata: string | undefined): string {
  const ascii = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const initials = ascii
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 8);
  const base = initials.length >= 2 ? initials : ascii.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  const code = iata ? `${base}-${iata}` : base;
  return /^[A-Z]/.test(code) ? code.slice(0, 20) : `X${code}`.slice(0, 20);
}

export type ReviewFormProps = {
  registration: RegistrationDetail;
  onShareChange: (pct: number | undefined) => void;
  onDecided: () => void;
};

/** Approve (code, share, note) or reject (note) a SUBMITTED registration; the status flips optimistically. */
export function ReviewForm({ registration, onShareChange, onDecided }: ReviewFormProps) {
  const toast = useToast();
  const approve = useApproveRegistration();
  const reject = useRejectRegistration();
  const pending = approve.isPending || reject.isPending;
  const isAco = registration.orgType === 'ACO';
  const [mode, setMode] = useState<'approve' | 'reject'>('approve');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'approve', code: suggestCode(registration.organisation.name, registration.airport?.iata), marketSharePct: registration.marketSharePct === null ? '' : String(registration.marketSharePct), note: '' },
  });
  const { register, handleSubmit, setError, setValue, watch, clearErrors, formState } = form;

  const shareText = watch('marketSharePct');
  useEffect(() => {
    const n = Number(shareText);
    onShareChange(shareText.trim() === '' || !Number.isFinite(n) ? undefined : n);
  }, [shareText, onShareChange]);

  const switchMode = (next: 'approve' | 'reject') => {
    setMode(next);
    setValue('mode', next);
    clearErrors();
  };

  const onSubmit = handleSubmit((values) => {
    const fail = (e: unknown) => {
      if (!applyServerErrors(e, setError, FIELDS)) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
    };
    if (values.mode === 'reject') {
      reject.mutate(
        { id: registration.id, note: values.note },
        {
          onSuccess: () => {
            toast.success(`${registration.organisation.name} rejected`, { description: 'The applicant has been told why.' });
            onDecided();
          },
          onError: fail,
        },
      );
      return;
    }
    const share = isAco && values.marketSharePct !== '' ? Number(values.marketSharePct) : undefined;
    approve.mutate(
      { id: registration.id, code: values.code, ...(share !== undefined ? { marketSharePct: share } : {}), ...(values.note ? { note: values.note } : {}) },
      {
        onSuccess: (r) => {
          toast.success(`${r.organisation.name} approved`, { description: `${registration.admin.email} has been invited as administrator.` });
          onDecided();
        },
        onError: fail,
      },
    );
  });

  return (
    <form id="review-form" className={styles.decision} onSubmit={onSubmit} noValidate aria-label="Decision">
      <h3 className={styles.sectionTitle}>{mode === 'approve' ? 'Approve' : 'Reject'}</h3>
      <input type="hidden" {...register('mode')} />
      {mode === 'approve' ? (
        <>
          <div className={styles.formRow}>
            <Input label="Organisation code" required mono maxLength={20} hint="Unique; used in reports" error={formState.errors.code?.message} {...register('code')} />
            {isAco ? (
              <Input label="Market share" mono inputMode="decimal" suffix="%" hint={registration.marketSharePct === null ? 'Not requested; optional' : `Requested ${registration.marketSharePct} %`} error={formState.errors.marketSharePct?.message} {...register('marketSharePct')} />
            ) : null}
          </div>
          <Textarea label="Note" hint="Optional; kept with the request" rows={2} error={formState.errors.note?.message} {...register('note')} />
          <div className={styles.decisionActions}>
            <Button variant="ghost" onClick={() => switchMode('reject')} disabled={pending}>
              Reject instead…
            </Button>
            <Button variant="primary" type="submit" loading={approve.isPending} disabled={reject.isPending}>
              Approve and invite administrator
            </Button>
          </div>
        </>
      ) : (
        <>
          <Textarea label="Reason" required hint="Sent to the applicant by e-mail" rows={3} error={formState.errors.note?.message} {...register('note')} data-autofocus />
          <div className={styles.decisionActions}>
            <Button variant="ghost" onClick={() => switchMode('approve')} disabled={pending}>
              Back
            </Button>
            <Button variant="danger" type="submit" loading={reject.isPending} disabled={approve.isPending}>
              Reject request
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
