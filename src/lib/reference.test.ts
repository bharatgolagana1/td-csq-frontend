import { describe, expect, it } from 'vitest';

import { registrationReference, shortReference } from './reference';

describe('shortReference', () => {
  it('keeps the prefix and the id’s last six characters, upper case', () => {
    expect(registrationReference('6915c2a1f0e4b3a29c3f9a2c')).toBe('REG-3F9A2C');
    expect(shortReference('INV', 'abc')).toBe('INV-ABC');
  });
});
