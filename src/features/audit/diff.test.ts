import { describe, expect, it } from 'vitest';

import { changedCount, diffRows, flatten } from './diff';

describe('flatten', () => {
  it('flattens nested objects and arrays to dotted paths', () => {
    expect(flatten({ a: 1, b: { c: 'x', d: [true, null] }, e: [] })).toEqual({ a: '1', 'b.c': 'x', 'b.d.0': 'true', 'b.d.1': 'null', e: '[]' });
  });

  it('keeps a scalar snapshot as one unnamed row', () => {
    expect(flatten('LOCKED')).toEqual({ '': 'LOCKED' });
    expect(flatten({})).toEqual({ '': '{}' });
  });
});

describe('diffRows', () => {
  it('marks changed, added and removed paths and keeps first-seen order', () => {
    const before = { status: 'IN_PROGRESS', selectedCount: 37, lockedBy: null, note: 'old' };
    const after = { status: 'LOCKED', selectedCount: 50, lockedBy: 'u1', lockedAt: '2026-10-07T09:00:00.000Z' };
    const rows = diffRows(before, after);
    expect(rows.map((r) => r.path)).toEqual(['status', 'selectedCount', 'lockedBy', 'note', 'lockedAt']);
    expect(rows.find((r) => r.path === 'status')).toEqual({ path: 'status', before: 'IN_PROGRESS', after: 'LOCKED', changed: true });
    expect(rows.find((r) => r.path === 'note')).toEqual({ path: 'note', before: 'old', after: undefined, changed: true });
    expect(rows.find((r) => r.path === 'lockedAt')?.before).toBeUndefined();
    expect(changedCount(rows)).toBe(5);
  });

  it('reports no change for equal snapshots and tolerates a missing side', () => {
    const same = { a: { b: 1 } };
    expect(changedCount(diffRows(same, { a: { b: 1 } }))).toBe(0);
    expect(diffRows(undefined, { created: true })).toEqual([{ path: 'created', before: undefined, after: 'true', changed: true }]);
    expect(diffRows(undefined, undefined)).toEqual([]);
  });
});
