/* The selected membership (organisation) drives the `x-csq-org` header.
   localStorage can throw (private mode, blocked storage) — every access is guarded. */

const KEY = 'csq.org';

export function readSelectedOrg(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeSelectedOrg(orgId: string | null): void {
  try {
    if (orgId) localStorage.setItem(KEY, orgId);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
