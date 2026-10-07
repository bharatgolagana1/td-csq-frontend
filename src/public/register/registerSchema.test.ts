import { describe, expect, it } from 'vitest';

import { EMPTY_VALUES, registerSchema, STEP_FIELDS, stepForField, toRegistrationInput } from './registerSchema';

const VALID = {
  organisation: {
    name: 'Delhi Cargo Handlers',
    legalName: '',
    address: { line1: 'Plot 7', line2: '', city: 'New Delhi', state: 'Delhi', pincode: '110037' },
    contact: { name: 'Rahul Verma', email: 'Rahul@DCH.example', phone: '+91 98765 43210' },
  },
  operations: { domestic: true, international: false },
  admin: { name: 'Meera Iyer', email: 'meera@dch.example', phone: '+91 98111 12222' },
  marketSharePct: '12.5',
};

describe('registerSchema', () => {
  it('rejects the empty form on every required field', () => {
    const result = registerSchema.safeParse(EMPTY_VALUES);
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['organisation.name', 'organisation.address.line1', 'organisation.contact.email', 'admin.phone']));
  });

  it('requires at least one operation and a share between 0 and 100', () => {
    const noOps = registerSchema.safeParse({ ...VALID, operations: { domestic: false, international: false } });
    expect(noOps.success).toBe(false);
    expect(noOps.success ? [] : noOps.error.issues.map((i) => i.path.join('.'))).toContain('operations.domestic');
    const over = registerSchema.safeParse({ ...VALID, marketSharePct: '120' });
    expect(over.success).toBe(false);
  });

  it('builds the POST body: lower-cased e-mails, null line2, share only for operators', () => {
    const parsed = registerSchema.parse(VALID);
    expect(parsed.organisation.contact.email).toBe('rahul@dch.example');
    const aco = toRegistrationInput(parsed, 'ACO');
    expect(aco.organisation.address.line2).toBeNull();
    expect(aco.organisation.legalName).toBeUndefined();
    expect(aco.marketSharePct).toBe(12.5);
    expect(toRegistrationInput(parsed, 'AIRPORT').marketSharePct).toBeUndefined();
  });

  it('maps server field errors back to their step', () => {
    expect(stepForField('organisation.name')).toBe(0);
    expect(stepForField('organisation.address.pincode')).toBe(1);
    expect(stepForField('admin.email')).toBe(2);
    expect(stepForField('something.else')).toBe(0);
    expect(STEP_FIELDS).toHaveLength(4);
  });
});
