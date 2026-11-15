import { describe, expect, it } from 'vitest';

import { builderFields } from './builderSchema';

describe('builderFields', () => {
  it('needs a minimum sample of at least one customer, as the API does', () => {
    const field = builderFields.shape.minSampleSize;
    const zero = field.safeParse(0);
    expect(zero.success).toBe(false);
    expect(zero.error?.issues[0]?.message).toBe('At least 1 customer');
    expect(field.safeParse(-3).success).toBe(false);
    expect(field.safeParse(2.5).error?.issues[0]?.message).toBe('Enter a whole number');
    expect(field.safeParse(1).success).toBe(true);
    expect(field.safeParse(100000).success).toBe(true);
  });
});
