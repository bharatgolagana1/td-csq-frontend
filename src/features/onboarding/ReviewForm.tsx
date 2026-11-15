import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ApiError, errorMessage, errorRequestId, isApiError } from '@/api/client';
import { useApproveRegistration, useRejectRegistration } from '@/api/onboarding';
import { type RegistrationDetail } from '@/api/onboarding.types';
import { Button, Input, Textarea, useToast } from '@/design/primitives';
import { applyServerErrors } from '@/lib/formErrors';

import { ApprovalShares } from './ApprovalShares';
import styles from './onboarding.module.css';
import { useApprovalShares } from './useApprovalShares';

const schema = z
  .object({
    mode: z.enum(['approve', 'reject']),
    code: z.string().trim().toUpperCase(),
    note: z.string().trim().max(500, 'Up to 500 characters'),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'approve') {
      if (!/^[A-Z][A-Z0-9_-]{1,19}$/.test(v.code)) ctx.addIssue({ code: 'custom', path: ['code'], message: '2–20 characters: letters, digits, _ or -; starts with a letter' });
    } else if (v.note.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'Tell the applicant why' });
    }
  });

type FormValues = z.input<typeof schema>;
const FIELDS = ['code', 'note'] as const;

/** The server's share issues (`shares…`, `marketSharePct`), e.g. "No share given for CSC-DEL …". */
function shareIssues(e: unknown): string[] {
  if (!(e instanceof ApiError) || !isApiError(e, 'VALIDATION')) return [];
  const issues = (e.details as { issues?: { path?: string; message?: string }[] } | undefined)?.issues ?? [];
  return issues.filter((i) => typeof i.path === 'string' && /^(shares|marketSharePct)/.test(i.path)).map((i) => i.message ?? e.message);
}

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
  onDecided: () => void;
};

/**
 * Approve (code, the airport's shares with the new operator, note) or reject
 * (note) a SUBMITTED registration; the status flips optimistically. An
 * operator is approved only with a share set that totals 100 %.
 */
export function ReviewForm({ registration, onDecided }: ReviewFormProps) {
  const toast = useToast();
  const approve = useApproveRegistration();
  const reject = useRejectRegistration();
  const pending = approve.isPending || reject.isPending;
  const withShares = registration.orgType === 'ACO' && registration.marketShare !== null;
  const shares = useApprovalShares(registration);
  const [mode, setMode] = useState<'approve' | 'reject'>('approve');
  const [serverShareIssues, setServerShareIssues] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'approve', code: suggestCode(registration.organisation.name, registration.airport?.iata), note: '' },
  });
  const { register, handleSubmit, setError, setValue, clearErrors, formState } = form;
  const sharesHold = !withShares || shares.canApprove;

  const switchMode = (next: 'approve' | 'reject') => {
    setMode(next);
    setValue('mode', next);
    clearErrors();
  };

  const onSubmit = handleSubmit((values) => {
    const fail = (e: unknown) => {
      const issues = shareIssues(e);
      setServerShareIssues(issues);
      if (!applyServerErrors(e, setError, FIELDS) && issues.length === 0) toast.error(errorMessage(e), { requestId: errorRequestId(e) });
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
    if (!sharesHold) return;
    setServerShareIssues([]);
    approve.mutate(
      { id: registration.id, code: values.code, ...(withShares ? shares.body : {}), ...(values.note ? { note: values.note } : {}) },
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
          <Input label="Organisation code" required mono maxLength={20} hint="Unique; used in reports" error={formState.errors.code?.message} {...register('code')} />
          {withShares ? <ApprovalShares registration={registration} editor={shares} /> : null}
          {serverShareIssues.length > 0 ? (
            <ul className={styles.errorBox} role="alert" aria-label="Market share problems">
              {serverShareIssues.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : null}
          <Textarea label="Note" hint="Optional; kept with the request" rows={2} error={formState.errors.note?.message} {...register('note')} />
          <div className={styles.decisionActions}>
            {!sharesHold ? <span className={styles.decisionHint}>Approve once the shares total exactly 100 %.</span> : null}
            <Button variant="ghost" onClick={() => switchMode('reject')} disabled={pending}>
              Reject instead…
            </Button>
            <Button variant="primary" type="submit" loading={approve.isPending} disabled={reject.isPending || !sharesHold}>
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
