import { useId, useState, type FC, type FormEvent } from 'react';
import { z } from 'zod';
import type { Customer, CustomerDraft, ImportField } from '../api/sampling.types';
import {
  CUSTOMER_TYPES,
  FORM_SCOPES,
  SCOPE_DIRECTIONS,
  SCOPE_LABEL,
  TYPE_LABEL,
  sameDomain,
} from '../api/sampling.logic';
import Dialog from './Dialog';

interface Props {
  open: boolean;
  existing: Customer[];
  operatorDomain: string;
  busy: boolean;
  onClose: () => void;
  onAdd: (draft: CustomerDraft) => Promise<void>;
}

const schema = z.object({
  name: z.string().trim().min(1, 'A contact name is required.').max(80, 'Keep the name under 80 characters.'),
  company: z.string().trim().min(1, 'A company is required.'),
  email: z
    .string()
    .trim()
    .min(1, 'An email is required. The assessment link is sent to it.')
    .email('That does not look like an email address.'),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 13;
    }, 'Enter 10 to 13 digits, with the country code if you have it.'),
  type: z.enum(['FREIGHT_FORWARDER', 'CUSTOMS_BROKER']),
  scope: z.enum(['INTERNATIONAL', 'DOMESTIC', 'BOTH']),
});

type FormState = Record<ImportField, string>;

const BLANK: FormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  type: 'FREIGHT_FORWARDER',
  scope: 'INTERNATIONAL',
};

export const AddCustomerDialog: FC<Props> = ({ open, existing, operatorDomain, busy, onClose, onAdd }) => {
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<ImportField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [addAnother, setAddAnother] = useState(false);
  const ids = {
    name: useId(),
    company: useId(),
    email: useId(),
    phone: useId(),
    type: useId(),
    scope: useId(),
  };

  const set = (field: ImportField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const close = () => {
    setForm(BLANK);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Partial<Record<ImportField, string>> = {};
      (Object.keys(flat) as ImportField[]).forEach((field) => {
        const messages = flat[field];
        if (messages && messages.length > 0) next[field] = messages[0];
      });
      setErrors(next);
      return;
    }

    const email = parsed.data.email.toLowerCase();
    if (existing.some((customer) => customer.email.toLowerCase() === email)) {
      setErrors({ email: 'This email is already in your directory.' });
      return;
    }

    try {
      await onAdd({ ...parsed.data, email });
      if (addAnother) {
        // Keep company and scope: contacts almost always arrive a firm at a time.
        setForm({ ...BLANK, company: parsed.data.company, type: form.type, scope: form.scope });
        setErrors({});
        setSubmitError(null);
      } else {
        close();
      }
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'That contact could not be saved.');
    }
  };

  const ownDomainWarning = form.email.includes('@') && sameDomain(form.email, operatorDomain);

  return (
    <Dialog
      open={open}
      title="Add a customer"
      subtitle="A named person at a forwarder or a broker who has used this terminal in the cycle."
      onClose={close}
      footer={
        <>
          <label className="smp-confirm" style={{ border: 0, background: 'none', padding: 0, fontSize: 12.5 }}>
            <input type="checkbox" checked={addAnother} onChange={(event) => setAddAnother(event.target.checked)} />
            Keep this open to add another
          </label>
          <button type="button" className="smp-btn" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="smp-btn smp-btn--primary" form="smp-add-form" disabled={busy}>
            {busy ? 'Saving...' : 'Add to directory'}
          </button>
        </>
      }
    >
      <form id="smp-add-form" onSubmit={submit} noValidate>
        <div className="smp-grid2">
          <div className="smp-field">
            <label htmlFor={ids.name}>Contact name</label>
            <input
              id={ids.name}
              className="smp-input"
              value={form.name}
              autoComplete="off"
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? `${ids.name}-err` : undefined}
              onChange={(event) => set('name', event.target.value)}
            />
            {errors.name ? (
              <span className="err" id={`${ids.name}-err`}>
                {errors.name}
              </span>
            ) : null}
          </div>

          <div className="smp-field">
            <label htmlFor={ids.company}>Company</label>
            <input
              id={ids.company}
              className="smp-input"
              value={form.company}
              autoComplete="off"
              aria-invalid={errors.company ? 'true' : undefined}
              aria-describedby={errors.company ? `${ids.company}-err` : undefined}
              onChange={(event) => set('company', event.target.value)}
            />
            {errors.company ? (
              <span className="err" id={`${ids.company}-err`}>
                {errors.company}
              </span>
            ) : null}
          </div>

          <div className="smp-field">
            <label htmlFor={ids.email}>Email</label>
            <input
              id={ids.email}
              className="smp-input"
              type="email"
              inputMode="email"
              value={form.email}
              autoComplete="off"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? `${ids.email}-err` : `${ids.email}-hint`}
              onChange={(event) => set('email', event.target.value)}
            />
            {errors.email ? (
              <span className="err" id={`${ids.email}-err`}>
                {errors.email}
              </span>
            ) : (
              <span className="hint" id={`${ids.email}-hint`}>
                {ownDomainWarning
                  ? 'This is your own mail domain. A colleague belongs in the self assessment, not the customer sample.'
                  : 'The assessment link is sent here and by WhatsApp.'}
              </span>
            )}
          </div>

          <div className="smp-field">
            <label htmlFor={ids.phone}>Phone</label>
            <input
              id={ids.phone}
              className="smp-input"
              type="tel"
              inputMode="tel"
              value={form.phone}
              autoComplete="off"
              aria-invalid={errors.phone ? 'true' : undefined}
              aria-describedby={errors.phone ? `${ids.phone}-err` : undefined}
              onChange={(event) => set('phone', event.target.value)}
            />
            {errors.phone ? (
              <span className="err" id={`${ids.phone}-err`}>
                {errors.phone}
              </span>
            ) : null}
          </div>

          <div className="smp-field">
            <label htmlFor={ids.type}>Customer type</label>
            <select
              id={ids.type}
              className="smp-select"
              value={form.type}
              onChange={(event) => set('type', event.target.value)}
            >
              {CUSTOMER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="smp-field">
            <label htmlFor={ids.scope}>Form scope</label>
            <select
              id={ids.scope}
              className="smp-select"
              value={form.scope}
              aria-describedby={`${ids.scope}-hint`}
              onChange={(event) => set('scope', event.target.value)}
            >
              {FORM_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {SCOPE_LABEL[scope]}
                </option>
              ))}
            </select>
            <span className="hint" id={`${ids.scope}-hint`}>
              Rates {SCOPE_DIRECTIONS[form.scope as keyof typeof SCOPE_DIRECTIONS]}. Every question is answered
              once per direction.
            </span>
          </div>
        </div>

        {submitError ? (
          <p className="smp-note smp-note--bad" role="alert" style={{ marginTop: 16, marginBottom: 0 }}>
            {submitError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
};

export default AddCustomerDialog;
