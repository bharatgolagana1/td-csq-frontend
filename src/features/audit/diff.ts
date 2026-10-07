/* Before/after diff of two audit snapshots. Both values are flattened to dotted
   paths ("defaults.reminders.sampling.count") so nested documents compare row
   by row; arrays are indexed ("tasks.3"). Pure, so the drawer and the tests
   share it. */

export type DiffRow = {
  path: string;
  before: string | undefined;
  after: string | undefined;
  changed: boolean;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Flattens a snapshot into `{ 'a.b': 'formatted leaf' }`; scalars become a single '' path. */
export function flatten(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) out[prefix] = '{}';
    keys.forEach((k) => flatten(value[k], prefix ? `${prefix}.${k}` : k, out));
    return out;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) out[prefix] = '[]';
    value.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  out[prefix] = formatLeaf(value);
  return out;
}

export function formatLeaf(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/** Rows for every path present on either side, in first-seen order, with `changed` where the sides differ. */
export function diffRows(before: unknown, after: unknown): DiffRow[] {
  const b = before === undefined ? {} : flatten(before);
  const a = after === undefined ? {} : flatten(after);
  const paths = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
  return paths.map((path) => {
    const bv = path in b ? b[path] : undefined;
    const av = path in a ? a[path] : undefined;
    return { path, before: bv, after: av, changed: bv !== av };
  });
}

export function changedCount(rows: DiffRow[]): number {
  return rows.filter((r) => r.changed).length;
}
