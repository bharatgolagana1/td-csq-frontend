/* Hand-written mirrors of the API contract (td-csq-backend/docs/ARCHITECTURE.md §4–§6).
   Identity, settings and the organisation summaries the Users area needs. */

export type OrgType = 'ACFI' | 'ACO' | 'AIRPORT';
export type RoleScope = 'PLATFORM' | 'ACO' | 'AIRPORT';
export type UserStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';
export type MembershipStatus = 'ACTIVE' | 'INACTIVE';

export type Scope = { kind: 'PLATFORM' } | { kind: 'ACO'; acoId: string } | { kind: 'AIRPORT'; airportId: string };

/** The 32 task codes declared by the backend modules (§4). */
export type TaskCode =
  | 'airports.view'
  | 'airports.manage'
  | 'operators.view'
  | 'operators.manage'
  | 'onboarding.links'
  | 'onboarding.review'
  | 'surveys.view'
  | 'surveys.manage'
  | 'marketshare.view'
  | 'marketshare.manage'
  | 'cycles.view'
  | 'cycles.manage'
  | 'cycles.publish'
  | 'cycles.operate'
  | 'customers.view'
  | 'customers.manage'
  | 'sampling.view'
  | 'sampling.manage'
  | 'sampling.lock'
  | 'sampling.unlock'
  | 'assessments.self'
  | 'assessments.view'
  | 'reports.operator'
  | 'reports.airport'
  | 'reports.national'
  | 'monitoring.view'
  | 'users.view'
  | 'users.manage'
  | 'roles.view'
  | 'roles.manage'
  | 'notifications.view'
  | 'notifications.send'
  | 'audit.view'
  | 'settings.view'
  | 'settings.manage';

export type Membership = {
  id?: string;
  orgId: string;
  orgName: string;
  orgType: OrgType;
  roleCode: string;
  airportId?: string;
  status?: MembershipStatus;
};

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** GET /me */
export type Me = {
  user: User;
  memberships: Membership[];
  active: {
    orgId: string;
    roleCode: string;
    tasks: string[];
    scope: Scope;
  };
};

/** GET /users rows */
export type UserRow = User & { memberships: Membership[] };

export type InviteUserInput = {
  name: string;
  email: string;
  phone?: string;
  orgId: string;
  roleCode: string;
};

export type UpdateUserInput = {
  name?: string;
  phone?: string;
  status?: UserStatus;
};

export type Role = {
  id: string;
  code: string;
  name: string;
  description?: string;
  scope: RoleScope;
  system: boolean;
  taskCount?: number;
};

export type TaskDefinition = {
  code: string;
  module: string;
  name: string;
  description?: string;
};

/** GET /roles/matrix */
export type RoleMatrix = {
  tasks: TaskDefinition[];
  roles: (Role & { tasks: string[] })[];
};

/** PUT /roles/matrix */
export type RoleMatrixInput = {
  roles: { roleId: string; tasks: string[] }[];
};

export type ReminderPlan = { count: number; everyDays: number };

/** GET /settings */
export type Settings = {
  scoring: { minResponses: number; weightingMode: 'EQUAL' | 'WEIGHTED' };
  defaults: {
    samplingDays: number;
    assessmentDays: number;
    reminders: { sampling: ReminderPlan; assessment: ReminderPlan };
    tz: string;
  };
  branding: { orgName: string };
  revealAssessorIdentity?: boolean;
  rbacVersion: number;
};

export type SettingsPatch = {
  scoring?: Partial<Settings['scoring']>;
  defaults?: Partial<Omit<Settings['defaults'], 'reminders'>> & { reminders?: Partial<Settings['defaults']['reminders']> };
  branding?: Partial<Settings['branding']>;
  revealAssessorIdentity?: boolean;
};

/** GET /operators rows (organisations module) */
export type OperatorSummary = {
  id: string;
  code: string;
  name: string;
  airport: { id: string; iata: string; name: string };
  operations: { domestic: boolean; international: boolean };
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  memberCount: number;
  customerCount: number;
  currentShare?: number;
};

export type PageMeta = { page: number; pageSize: number; total: number };
export type Page<T> = { data: T[]; meta: PageMeta };

export type ListQuery = {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
} & Record<string, string | number | boolean | undefined>;
