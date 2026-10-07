import { type Membership, type Role, type RoleMatrix, type TaskDefinition, type UserRow } from '@/api/types';
import { type Session } from '@/auth/session';

/* DEV ONLY — sample identities and reference data for the design gallery. */

export type DevRole = 'platform' | 'operator' | 'airport';

export const TASKS: TaskDefinition[] = [
  { code: 'airports.view', module: 'airports', name: 'View airports' },
  { code: 'airports.manage', module: 'airports', name: 'Manage airports' },
  { code: 'operators.view', module: 'organisations', name: 'View operators' },
  { code: 'operators.manage', module: 'organisations', name: 'Manage operators' },
  { code: 'onboarding.links', module: 'onboarding', name: 'Issue onboarding links' },
  { code: 'onboarding.review', module: 'onboarding', name: 'Review registrations' },
  { code: 'surveys.view', module: 'surveys', name: 'View surveys' },
  { code: 'surveys.manage', module: 'surveys', name: 'Edit and publish surveys' },
  { code: 'marketshare.view', module: 'organisations', name: 'View market share' },
  { code: 'marketshare.manage', module: 'organisations', name: 'Set market share' },
  { code: 'cycles.view', module: 'cycles', name: 'View cycles' },
  { code: 'cycles.manage', module: 'cycles', name: 'Create and edit cycles' },
  { code: 'cycles.publish', module: 'cycles', name: 'Publish cycles' },
  { code: 'cycles.operate', module: 'cycles', name: 'Operate the cycle clock' },
  { code: 'customers.view', module: 'customers', name: 'View customers' },
  { code: 'customers.manage', module: 'customers', name: 'Manage customers' },
  { code: 'sampling.view', module: 'sampling', name: 'View sampling' },
  { code: 'sampling.manage', module: 'sampling', name: 'Select participants' },
  { code: 'sampling.lock', module: 'sampling', name: 'Lock the sample' },
  { code: 'sampling.unlock', module: 'sampling', name: 'Unlock a sample' },
  { code: 'assessments.self', module: 'assessments', name: 'Complete the self-assessment' },
  { code: 'assessments.view', module: 'assessments', name: 'View assessments' },
  { code: 'reports.operator', module: 'reports', name: 'Operator dashboard' },
  { code: 'reports.airport', module: 'reports', name: 'Airport report' },
  { code: 'reports.national', module: 'reports', name: 'National report' },
  { code: 'monitoring.view', module: 'reports', name: 'Monitoring overview' },
  { code: 'users.view', module: 'identity', name: 'View users' },
  { code: 'users.manage', module: 'identity', name: 'Invite and manage users' },
  { code: 'roles.view', module: 'identity', name: 'View roles' },
  { code: 'roles.manage', module: 'identity', name: 'Edit the role matrix' },
  { code: 'notifications.view', module: 'notifications', name: 'View notifications' },
  { code: 'notifications.send', module: 'notifications', name: 'Resend notifications' },
  { code: 'audit.view', module: 'audit', name: 'View the audit log' },
  { code: 'settings.view', module: 'settings', name: 'View settings' },
  { code: 'settings.manage', module: 'settings', name: 'Change settings' },
];

const ALL = TASKS.map((t) => t.code);
const views = ALL.filter((c) => c.endsWith('.view'));

export const ROLE_TASKS: Record<string, string[]> = {
  SUPER_ADMIN: ALL,
  ACFI_ANALYST: [...views, 'reports.operator', 'reports.airport', 'reports.national', 'monitoring.view'],
  ACO_ADMIN: ['customers.view', 'customers.manage', 'sampling.view', 'sampling.manage', 'sampling.lock', 'assessments.self', 'assessments.view', 'reports.operator', 'users.view', 'users.manage', 'settings.view', 'cycles.view'],
  ACO_USER: ['customers.view', 'sampling.view', 'assessments.self', 'reports.operator', 'cycles.view'],
  AIRPORT_ADMIN: ['reports.airport', 'users.view', 'users.manage'],
  AIRPORT_VIEWER: ['reports.airport'],
};

export const ROLES: Role[] = [
  { id: 'r1', code: 'SUPER_ADMIN', name: 'Super admin', description: 'ACFI platform owner', scope: 'PLATFORM', system: true },
  { id: 'r2', code: 'ACFI_ANALYST', name: 'ACFI analyst', description: 'Read-only platform analyst', scope: 'PLATFORM', system: true },
  { id: 'r3', code: 'ACO_ADMIN', name: 'Operator admin', description: 'Runs sampling for an operator', scope: 'ACO', system: true },
  { id: 'r4', code: 'ACO_USER', name: 'Operator user', description: 'Views the operator dashboard', scope: 'ACO', system: true },
  { id: 'r5', code: 'AIRPORT_ADMIN', name: 'Airport admin', scope: 'AIRPORT', system: true },
  { id: 'r6', code: 'AIRPORT_VIEWER', name: 'Airport viewer', scope: 'AIRPORT', system: true },
];

export function roleMatrix(): RoleMatrix {
  return { tasks: TASKS, roles: ROLES.map((r) => ({ ...r, tasks: [...(ROLE_TASKS[r.code] ?? [])] })) };
}

const ACFI: Membership = { id: 'm1', orgId: 'org-acfi', orgName: 'Air Cargo Forum India', orgType: 'ACFI', roleCode: 'SUPER_ADMIN' };
const CSC: Membership = { id: 'm2', orgId: 'org-csc', orgName: 'Cargo Service Center', orgType: 'ACO', roleCode: 'ACO_ADMIN', airportId: 'ap-del' };
const DEL: Membership = { id: 'm3', orgId: 'org-del', orgName: 'Delhi Airport', orgType: 'AIRPORT', roleCode: 'AIRPORT_ADMIN', airportId: 'ap-del' };

export function mockSession(role: DevRole): Session {
  if (role === 'operator') {
    return {
      user: { id: 'u2', name: 'Priya Natarajan', email: 'priya@csc.example', phone: '+91 98 1234 5678', status: 'ACTIVE' },
      org: { id: CSC.orgId, name: CSC.orgName, type: 'ACO', airportId: 'ap-del' },
      role: { code: 'ACO_ADMIN', scope: 'ACO' },
      scope: { kind: 'ACO', acoId: CSC.orgId },
      tasks: new Set(ROLE_TASKS.ACO_ADMIN),
      memberships: [CSC],
    };
  }
  if (role === 'airport') {
    return {
      user: { id: 'u3', name: 'Rohan Mehta', email: 'rohan@delhiairport.example', status: 'ACTIVE' },
      org: { id: DEL.orgId, name: DEL.orgName, type: 'AIRPORT', airportId: 'ap-del' },
      role: { code: 'AIRPORT_ADMIN', scope: 'AIRPORT' },
      scope: { kind: 'AIRPORT', airportId: 'ap-del' },
      tasks: new Set(ROLE_TASKS.AIRPORT_ADMIN),
      memberships: [DEL],
    };
  }
  return {
    user: { id: 'u1', name: 'Anita Desai', email: 'anita@acfi.example', phone: '+91 98 7654 3210', status: 'ACTIVE' },
    org: { id: ACFI.orgId, name: ACFI.orgName, type: 'ACFI' },
    role: { code: 'SUPER_ADMIN', scope: 'PLATFORM' },
    scope: { kind: 'PLATFORM' },
    tasks: new Set(ROLE_TASKS.SUPER_ADMIN),
    memberships: [ACFI, CSC],
  };
}

const FIRST = ['Anita', 'Priya', 'Rohan', 'Kavya', 'Arjun', 'Meera', 'Vikram', 'Sneha', 'Rahul', 'Divya', 'Karan', 'Neha', 'Aditya', 'Pooja', 'Siddharth', 'Riya', 'Manish', 'Isha', 'Nikhil', 'Tara', 'Varun', 'Ananya', 'Dev', 'Lakshmi', 'Omar', 'Zara', 'Yash', 'Nidhi'];
const LAST = ['Desai', 'Natarajan', 'Mehta', 'Iyer', 'Sharma', 'Kapoor', 'Reddy', 'Bose', 'Nair', 'Joshi', 'Malhotra', 'Pillai', 'Chopra', 'Rao'];
const ORGS: Membership[] = [ACFI, CSC, DEL, { id: 'm4', orgId: 'org-celebi', orgName: 'Çelebi Delhi Cargo', orgType: 'ACO', roleCode: 'ACO_USER', airportId: 'ap-del' }, { id: 'm5', orgId: 'org-mial', orgName: 'Mumbai Cargo Terminal', orgType: 'ACO', roleCode: 'ACO_ADMIN', airportId: 'ap-bom' }];

export function sampleUsers(count = 57): UserRow[] {
  const statuses: UserRow['status'][] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INVITED', 'ACTIVE', 'SUSPENDED'];
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length] ?? 'User';
    const last = LAST[(i * 7) % LAST.length] ?? 'X';
    const org = ORGS[(i * 3) % ORGS.length] ?? ACFI;
    const status = statuses[i % statuses.length] ?? 'ACTIVE';
    const days = (i * 37) % 90;
    return {
      id: `u${100 + i}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@${org.orgName.split(' ')[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? 'org'}.example`.toLowerCase(),
      phone: i % 3 === 0 ? `+91 9${String(8000000000 + i * 12345).slice(0, 9)}` : undefined,
      status,
      lastLoginAt: status === 'INVITED' ? null : new Date(Date.now() - days * 86_400_000 - i * 3_600_000).toISOString(),
      memberships: [{ ...org, id: `m${100 + i}` }, ...(i % 9 === 0 ? [{ ...CSC, id: `m${200 + i}`, roleCode: 'ACO_USER' }] : [])],
    };
  });
}
