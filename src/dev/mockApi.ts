import { type Me, type RoleMatrix, type RoleMatrixInput, type Settings, type UserRow } from '@/api/types';
import { type Session } from '@/auth/session';

import { ROLES, roleMatrix, sampleUsers } from './mockSession';

/* DEV ONLY — intercepts fetch for the API base so the real Users & roles pages
   render inside the mocked shell. State lives for the page's lifetime. */

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

type Handler = (req: { method: string; path: string; url: URL; body: unknown }) => { status?: number; body?: unknown } | undefined;

let users: UserRow[] = sampleUsers();
let matrix: RoleMatrix = roleMatrix();
let seq = 1;
const reqId = () => `dev_${String(seq++).padStart(4, '0')}`;

const settings: Settings = {
  scoring: { minResponses: 3, weightingMode: 'EQUAL' },
  defaults: { samplingDays: 10, assessmentDays: 30, reminders: { sampling: { count: 3, everyDays: 3 }, assessment: { count: 10, everyDays: 2 } }, tz: 'Asia/Kolkata' },
  branding: { orgName: 'Air Cargo Forum India' },
  rbacVersion: 4,
};

function error(status: number, code: string, message: string, details?: unknown) {
  return { status, body: { error: { code, message, details, requestId: reqId() } } };
}

function sortUsers(rows: UserRow[], sort: string | null): UserRow[] {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const key = (desc ? sort.slice(1) : sort) as keyof UserRow;
  return [...rows].sort((a, b) => {
    const av = String(a[key] ?? '');
    const bv = String(b[key] ?? '');
    return desc ? bv.localeCompare(av) : av.localeCompare(bv);
  });
}

function makeHandler(session: Session): Handler {
  return ({ method, path, url, body }) => {
    if (method === 'GET' && path === '/me') {
      const me: Me = {
        user: session.user,
        memberships: session.memberships,
        active: { orgId: session.org.id, roleCode: session.role.code, tasks: Array.from(session.tasks), scope: session.scope },
      };
      return { body: { data: me } };
    }
    if (method === 'GET' && path === '/users') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const status = url.searchParams.get('status');
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
      let rows = users.filter((u) => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)) && (!status || u.status === status));
      rows = sortUsers(rows, url.searchParams.get('sort'));
      const start = (page - 1) * pageSize;
      return { body: { data: rows.slice(start, start + pageSize), meta: { page, pageSize, total: rows.length } } };
    }
    if (method === 'POST' && path === '/users') {
      const input = body as { name: string; email: string; phone?: string; orgId: string; roleCode: string };
      if (users.some((u) => u.email === input.email)) {
        return error(400, 'VALIDATION', 'Validation failed', { issues: [{ path: ['email'], message: 'A user with this e-mail already exists' }] });
      }
      const org = session.memberships.find((m) => m.orgId === input.orgId);
      const row: UserRow = {
        id: `u${Date.now()}`,
        name: input.name,
        email: input.email,
        status: 'INVITED',
        lastLoginAt: null,
        memberships: [{ id: `m${Date.now()}`, orgId: input.orgId, orgName: org?.orgName ?? 'Organisation', orgType: org?.orgType ?? 'ACO', roleCode: input.roleCode }],
        ...(input.phone ? { phone: input.phone } : {}),
      };
      users = [row, ...users];
      return { status: 201, body: { data: row } };
    }
    const patch = /^\/users\/([^/]+)$/.exec(path);
    if (method === 'PATCH' && patch) {
      const id = patch[1];
      const row = users.find((u) => u.id === id);
      if (!row) return error(404, 'NOT_FOUND', 'User not found');
      Object.assign(row, body as object);
      return { body: { data: row } };
    }
    if (method === 'GET' && path === '/roles') {
      return { body: { data: ROLES.map((r) => ({ ...r, taskCount: matrix.roles.find((m) => m.id === r.id)?.tasks.length ?? 0 })) } };
    }
    if (method === 'GET' && path === '/roles/matrix') return { body: { data: matrix } };
    if (method === 'PUT' && path === '/roles/matrix') {
      const input = body as RoleMatrixInput;
      const acoUser = input.roles.find((r) => r.roleId === 'r4');
      if (acoUser && !acoUser.tasks.includes('reports.operator')) {
        // Deliberate failure path so the error toast + request id can be reviewed.
        return error(409, 'CONFLICT', 'ACO_USER must keep reports.operator (operators always see their own dashboard).');
      }
      matrix = { ...matrix, roles: matrix.roles.map((r) => ({ ...r, tasks: input.roles.find((x) => x.roleId === r.id)?.tasks ?? r.tasks })) };
      settings.rbacVersion += 1;
      return { body: { data: matrix } };
    }
    if (method === 'GET' && path === '/operators') {
      return {
        body: {
          data: [
            { id: 'org-csc', code: 'CSC-DEL', name: 'Cargo Service Center', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 6, customerCount: 212, currentShare: 55 },
            { id: 'org-celebi', code: 'CLB-DEL', name: 'Çelebi Delhi Cargo', airport: { id: 'ap-del', iata: 'DEL', name: 'Delhi' }, operations: { domestic: true, international: true }, status: 'ACTIVE', memberCount: 4, customerCount: 180, currentShare: 45 },
            { id: 'org-mial', code: 'MCT-BOM', name: 'Mumbai Cargo Terminal', airport: { id: 'ap-bom', iata: 'BOM', name: 'Mumbai' }, operations: { domestic: true, international: false }, status: 'ACTIVE', memberCount: 3, customerCount: 97, currentShare: 100 },
          ],
          meta: { page: 1, pageSize: 200, total: 3 },
        },
      };
    }
    if (method === 'GET' && path === '/settings') return { body: { data: settings } };
    return undefined;
  };
}

let original: typeof fetch | undefined;

/** Patches window.fetch for the API base; returns a restore function. */
export function installMockApi(session: Session, latencyMs = 350): () => void {
  if (original) return () => undefined;
  original = window.fetch.bind(window);
  const handler = makeHandler(session);
  const real = original;
  window.fetch = async (input, init) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!urlStr.startsWith(BASE)) return real(input, init);
    const url = new URL(urlStr, window.location.origin);
    const path = url.pathname.slice(new URL(BASE, window.location.origin).pathname.length);
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    await new Promise((r) => setTimeout(r, latencyMs));
    const res = handler({ method, path, url, body }) ?? { status: 404, body: { error: { code: 'NOT_FOUND', message: `No mock for ${method} ${path}`, requestId: reqId() } } };
    return new Response(JSON.stringify(res.body ?? {}), { status: res.status ?? 200, headers: { 'Content-Type': 'application/json' } });
  };
  return () => {
    if (original) window.fetch = original;
    original = undefined;
  };
}
