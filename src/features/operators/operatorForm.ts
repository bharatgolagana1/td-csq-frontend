import { z } from 'zod';

import { type Address } from '@/api/operators.types';

/* Zod pieces shared by the create and edit drawers (mirrors organisations.schemas.ts). */

export const CODE_RE = /^[A-Z][A-Z0-9_-]{1,19}$/;
export const CODE_MESSAGE = '2–20 characters: letters, digits, _ or -; starts with a letter';

export const codeSchema = z.string().trim().toUpperCase().regex(CODE_RE, CODE_MESSAGE);

export const addressSchema = z.object({
  line1: z.string().trim().min(1, 'Enter the address').max(200),
  line2: z.string().trim().max(200),
  city: z.string().trim().min(1, 'Enter the city').max(120),
  state: z.string().trim().min(1, 'Enter the state').max(120),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Enter the 6-digit PIN code'),
});

export const contactSchema = z.object({
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

export const operationsSchema = z
  .object({ domestic: z.boolean(), international: z.boolean() })
  .refine((o) => o.domestic || o.international, { message: 'Choose at least one', path: ['domestic'] });

/** "" → undefined; otherwise a number 0–100. */
export const sharePctSchema = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : Number(v)))
  .pipe(z.number({ error: 'Enter a number' }).min(0, 'Between 0 and 100').max(100, 'Between 0 and 100').optional());

export type AddressValues = z.input<typeof addressSchema>;
export type ContactValues = z.input<typeof contactSchema>;

export const EMPTY_ADDRESS: AddressValues = { line1: '', line2: '', city: '', state: '', pincode: '' };
export const EMPTY_CONTACT: ContactValues = { name: '', email: '', phone: '' };

export function toAddress(values: z.output<typeof addressSchema>): Address {
  return { ...values, line2: values.line2 || null };
}

export function fromAddress(address: Address | null): AddressValues {
  return address ? { ...address, line2: address.line2 ?? '' } : EMPTY_ADDRESS;
}

export const ADDRESS_FIELDS = ['line1', 'line2', 'city', 'state', 'pincode'] as const;
export const CONTACT_FIELDS = ['name', 'email', 'phone'] as const;

/** Dotted field names for `applyServerErrors` ("address.line1" …). */
export function nested(prefix: string, fields: readonly string[]): string[] {
  return fields.map((f) => `${prefix}.${f}`);
}

/** Reads `errors.address.line1.message` from react-hook-form's nested error tree. */
export function errorAt(errors: unknown, path: string): string | undefined {
  let node: unknown = errors;
  for (const key of path.split('.')) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === 'string' ? message : undefined;
}
