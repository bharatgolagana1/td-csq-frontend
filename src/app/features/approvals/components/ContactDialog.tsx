import { useId, useState, type FC, type FormEvent } from 'react';
import type { ChangeReason, CompanyType, SampledContact } from '../api/approvals.types';
import { REASON_LABEL, REASONS_FOR } from '../lib/changes';
import { domainOf, normalisePhone } from '../lib/integrity';
import { COMPANY_TYPE_LABEL } from '../lib/labels';
import { Modal } from './Modal';

interface Props {
  mode: 'ADD' | 'EDIT';
  /** the working version, prefilled when correcting */
  contact?: SampledContact;
  defaultReason?: ChangeReason;
  defaultNote?: string;
  operatorDomains: string[];
  onCancel: () => void;
  onSave: (draft: DraftContact, reason: ChangeReason, note: string) => void;
}

export interface DraftContact {
  name: string;
  designation: string;
  company: string;
  companyType: CompanyType;
  email: string;
  phone: string;
}

type FieldKey = keyof DraftContact;

const COMPANY_TYPES: CompanyType[] = ['FREIGHT_FORWARDER', 'CUSTOMS_BROKER', 'SHIPPER', 'AIRLINE'];

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(draft: DraftContact): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!draft.name.trim()) errors.name = 'Give the contact a name.';
  if (!draft.designation.trim()) errors.designation = 'Give the role this person holds.';
  if (!draft.company.trim()) errors.company = 'Name the company they work for.';
  if (!EMAIL_SHAPE.test(draft.email.trim())) errors.email = 'Enter a working email address.';
  if (normalisePhone(draft.phone).length !== 10) {
    errors.phone = 'Enter a ten digit Indian mobile number.';
  }
  return errors;
}

export const ContactDialog: FC<Props> = ({
  mode,
  contact,
  defaultReason,
  defaultNote,
  operatorDomains,
  onCancel,
  onSave,
}) => {
  const ids = {
    name: useId(),
    designation: useId(),
    company: useId(),
    companyType: useId(),
    email: useId(),
    phone: useId(),
    reason: useId(),
    note: useId(),
  };

  const reasons = REASONS_FOR[mode];
  const [draft, setDraft] = useState<DraftContact>({
    name: contact?.name ?? '',
    designation: contact?.designation ?? '',
    company: contact?.company ?? '',
    companyType: contact?.companyType ?? 'FREIGHT_FORWARDER',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
  });
  const [reason, setReason] = useState<ChangeReason>(defaultReason ?? reasons[0]);
  const [note, setNote] = useState(defaultNote ?? '');
  const [showErrors, setShowErrors] = useState(false);

  const errors = validate(draft);
  const noteRequired = reason === 'OTHER';
  const noteMissing = noteRequired && note.trim().length < 5;
  const blocked = Object.keys(errors).length > 0 || noteMissing;

  const ownDomainWarning =
    draft.email.trim().length > 0 &&
    operatorDomains.some((d) => d.toLowerCase() === domainOf(draft.email));

  const set = <K extends FieldKey>(key: K, value: DraftContact[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (blocked) {
      setShowErrors(true);
      return;
    }
    onSave(
      {
        ...draft,
        name: draft.name.trim(),
        designation: draft.designation.trim(),
        company: draft.company.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      },
      reason,
      note.trim(),
    );
  };

  const field = (key: FieldKey, label: string, type = 'text') => (
    <div className="csq-ap-field">
      <label className="csq-ap-label" htmlFor={ids[key]}>
        {label}
      </label>
      <input
        id={ids[key]}
        className="csq-ap-input"
        type={type}
        value={draft[key]}
        onChange={(e) => set(key, e.target.value as DraftContact[FieldKey])}
        aria-invalid={showErrors && Boolean(errors[key])}
        aria-describedby={showErrors && errors[key] ? `${ids[key]}-err` : undefined}
      />
      {showErrors && errors[key] ? (
        <span className="csq-ap-error-text" id={`${ids[key]}-err`}>
          {errors[key]}
        </span>
      ) : null}
    </div>
  );

  return (
    <Modal
      title={mode === 'ADD' ? 'Add a contact to the sample' : 'Correct a contact'}
      description={
        mode === 'ADD'
          ? 'Added contacts are marked as yours in the diff the operator receives, with the reason you give here.'
          : 'Corrections are diffed against exactly what the operator submitted, field by field.'
      }
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="csq-ap-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" form="csq-ap-contact-form" className="csq-ap-btn csq-ap-btn--primary">
            {mode === 'ADD' ? 'Add contact' : 'Save correction'}
          </button>
        </>
      }
    >
      <form className="csq-ap-form" id="csq-ap-contact-form" onSubmit={submit} noValidate>
        <div className="csq-ap-form2">
          {field('name', 'Name')}
          {field('designation', 'Designation')}
        </div>

        <div className="csq-ap-form2">
          {field('company', 'Company')}
          <div className="csq-ap-field">
            <label className="csq-ap-label" htmlFor={ids.companyType}>
              Company type
            </label>
            <select
              id={ids.companyType}
              className="csq-ap-select"
              value={draft.companyType}
              onChange={(e) => set('companyType', e.target.value as CompanyType)}
            >
              {COMPANY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {COMPANY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="csq-ap-form2">
          {field('email', 'Email', 'email')}
          {field('phone', 'Phone', 'tel')}
        </div>

        {ownDomainWarning ? (
          <p className="csq-ap-error-text">
            That address is on the operator’s own domain. A customer assessor should not be the
            operator’s own staff.
          </p>
        ) : null}

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={ids.reason}>
            Reason code
          </label>
          <select
            id={ids.reason}
            className="csq-ap-select"
            value={reason}
            onChange={(e) => setReason(e.target.value as ChangeReason)}
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {REASON_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        <div className="csq-ap-field">
          <label className="csq-ap-label" htmlFor={ids.note}>
            Note {noteRequired ? '(required)' : '(optional)'}
          </label>
          <textarea
            id={ids.note}
            className="csq-ap-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you checked, and what you found."
            aria-invalid={showErrors && noteMissing}
            aria-describedby={`${ids.note}-hint`}
          />
          <span className={showErrors && noteMissing ? 'csq-ap-error-text' : 'csq-ap-hint'} id={`${ids.note}-hint`}>
            {showErrors && noteMissing
              ? 'A reason of Other has to be explained.'
              : 'The operator reads this alongside the reason code.'}
          </span>
        </div>
      </form>
    </Modal>
  );
};
