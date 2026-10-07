import { type Path } from 'react-hook-form';
import { z } from 'zod';

import { type LinkOrgType, type RegistrationInput } from '@/api/onboarding.types';

/* The registration form (POST /public/onboarding/:token body), validated step by step. */

const addressSchema = z.object({
  line1: z.string().trim().min(1, 'Enter the address').max(200),
  line2: z.string().trim().max(200),
  city: z.string().trim().min(1, 'Enter the city').max(120),
  state: z.string().trim().min(1, 'Enter the state').max(120),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Enter the 6-digit PIN code'),
});

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(120),
  email: z
    .string()
    .trim()
    .email('Enter a valid e-mail address')
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 \-()]{6,19}$/, 'Enter a valid phone number'),
});

export const registerSchema = z.object({
  organisation: z.object({
    name: z.string().trim().min(1, 'Enter your organisation’s name').max(200),
    legalName: z.string().trim().max(200),
    address: addressSchema,
    contact: contactSchema,
  }),
  operations: z
    .object({ domestic: z.boolean(), international: z.boolean() })
    .refine((o) => o.domestic || o.international, { message: 'Choose at least one', path: ['domestic'] }),
  admin: contactSchema,
  marketSharePct: z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : Number(v)))
    .pipe(z.number({ error: 'Enter a number' }).min(0, 'Between 0 and 100').max(100, 'Between 0 and 100').optional()),
});

export type RegisterValues = z.input<typeof registerSchema>;
export type RegisterOutput = z.output<typeof registerSchema>;

export const EMPTY_VALUES: RegisterValues = {
  organisation: {
    name: '',
    legalName: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '' },
    contact: { name: '', email: '', phone: '' },
  },
  operations: { domestic: true, international: false },
  admin: { name: '', email: '', phone: '' },
  marketSharePct: '',
};

export const STEPS = [
  { id: 'organisation', label: 'Organisation', description: 'Name and operations' },
  { id: 'address', label: 'Address & contact', description: 'Registered office' },
  { id: 'admin', label: 'Administrator', description: 'Your first user' },
  { id: 'review', label: 'Review', description: 'Check and submit' },
] as const;

/** Which fields each step validates before moving on. */
export const STEP_FIELDS: Path<RegisterValues>[][] = [
  ['organisation.name', 'organisation.legalName', 'operations', 'operations.domestic', 'operations.international', 'marketSharePct'],
  [
    'organisation.address.line1',
    'organisation.address.line2',
    'organisation.address.city',
    'organisation.address.state',
    'organisation.address.pincode',
    'organisation.contact.name',
    'organisation.contact.email',
    'organisation.contact.phone',
  ],
  ['admin.name', 'admin.email', 'admin.phone'],
  [],
];

/** Every dotted field name, for mapping server validation errors. */
export const ALL_FIELDS: string[] = STEP_FIELDS.flat();

/** The step that owns a (dotted) field name; 0 when unknown. */
export function stepForField(field: string): number {
  const i = STEP_FIELDS.findIndex((fields) => (fields as string[]).some((f) => field === f || field.startsWith(`${f}.`)));
  return i === -1 ? 0 : i;
}

export function toRegistrationInput(values: RegisterOutput, orgType: LinkOrgType): RegistrationInput {
  return {
    organisation: {
      name: values.organisation.name,
      ...(values.organisation.legalName ? { legalName: values.organisation.legalName } : {}),
      address: { ...values.organisation.address, line2: values.organisation.address.line2 || null },
      contact: values.organisation.contact,
    },
    admin: values.admin,
    operations: values.operations,
    ...(orgType === 'ACO' && values.marketSharePct !== undefined ? { marketSharePct: values.marketSharePct } : {}),
  };
}
