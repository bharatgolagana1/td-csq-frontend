import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, errorMessage, errorRequestId, isApiError } from '@/api/client';
import { readSelectedOrg, writeSelectedOrg } from '@/api/selectedOrg';
import { type Me, type Membership, type OrgType, type RoleScope, type Scope, type TaskCode, type User } from '@/api/types';

import { initKeycloak, keycloak, signOutKeycloak, startTokenRefresh } from './keycloak';
import { ErrorScreen, LoadingScreen, NoAccountScreen } from './screens';

/* AuthProvider (ARCHITECTURE §4): boots Keycloak (login-required, PKCE), loads
   GET /me, exposes the session. States: loading · ready · no-account · error.
   An optional `session` prop replaces the whole boot (dev gallery, tests). */

export type SessionOrg = { id: string; name: string; type: OrgType; airportId?: string };
export type SessionRole = { code: string; scope: RoleScope };

export type Session = {
  user: User;
  org: SessionOrg;
  role: SessionRole;
  scope: Scope;
  tasks: ReadonlySet<string>;
  memberships: Membership[];
};

export type SessionApi = Session & {
  hasTask: (task: TaskCode | TaskCode[]) => boolean;
  switchOrg: (orgId: string) => Promise<void>;
  signOut: () => void;
};

export type AuthState =
  | { status: 'loading' }
  | { status: 'ready'; session: Session }
  | { status: 'no-account'; email?: string }
  | { status: 'error'; message: string; requestId?: string };

const SessionContext = createContext<SessionApi | null>(null);
const AuthStateContext = createContext<AuthState>({ status: 'loading' });

function scopeOf(orgType: OrgType): RoleScope {
  return orgType === 'ACFI' ? 'PLATFORM' : orgType;
}

export function sessionFromMe(me: Me): Session {
  const active = me.memberships.find((m) => m.orgId === me.active.orgId) ?? me.memberships[0];
  const org: SessionOrg = active
    ? { id: active.orgId, name: active.orgName, type: active.orgType, ...(active.airportId ? { airportId: active.airportId } : {}) }
    : { id: me.active.orgId, name: 'Organisation', type: 'ACFI' };
  return {
    user: me.user,
    org,
    role: { code: me.active.roleCode, scope: scopeOf(org.type) },
    scope: me.active.scope,
    tasks: new Set(me.active.tasks),
    memberships: me.memberships,
  };
}

type Props = {
  children: ReactNode;
  /** Bypass Keycloak and /me (dev gallery, tests). */
  session?: Session;
};

export function AuthProvider({ children, session: override }: Props) {
  const qc = useQueryClient();
  const [state, setState] = useState<AuthState>(() => (override ? { status: 'ready', session: override } : { status: 'loading' }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (override) {
      setState({ status: 'ready', session: override });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const authenticated = await initKeycloak();
        if (!authenticated) {
          await keycloak.login();
          return;
        }
        const me = await api.get<Me>('/me');
        if (cancelled) return;
        const stored = readSelectedOrg();
        if (!stored || !me.memberships.some((m) => m.orgId === stored)) writeSelectedOrg(me.active.orgId);
        setState({ status: 'ready', session: sessionFromMe(me) });
      } catch (e) {
        if (cancelled) return;
        if (isApiError(e, 'FORBIDDEN')) {
          const parsed = keycloak.tokenParsed as { email?: string } | undefined;
          setState({ status: 'no-account', ...(parsed?.email ? { email: parsed.email } : {}) });
        } else {
          const requestId = errorRequestId(e);
          setState({ status: 'error', message: errorMessage(e), ...(requestId ? { requestId } : {}) });
        }
      }
    })();
    const stop = startTokenRefresh();
    return () => {
      cancelled = true;
      stop();
    };
  }, [override, attempt]);

  const signOut = useCallback(() => {
    writeSelectedOrg(null);
    qc.clear();
    if (override) return;
    void signOutKeycloak();
  }, [qc, override]);

  const switchOrg = useCallback(
    async (orgId: string) => {
      if (state.status !== 'ready' || orgId === state.session.org.id) return;
      writeSelectedOrg(orgId);
      if (override) {
        const m = override.memberships.find((x) => x.orgId === orgId);
        if (!m) return;
        qc.clear();
        setState({
          status: 'ready',
          session: {
            ...override,
            org: { id: m.orgId, name: m.orgName, type: m.orgType, ...(m.airportId ? { airportId: m.airportId } : {}) },
            role: { code: m.roleCode, scope: scopeOf(m.orgType) },
          },
        });
        return;
      }
      const me = await api.get<Me>('/me');
      qc.clear(); // tenancy changed: every cached query belongs to the old organisation
      setState({ status: 'ready', session: sessionFromMe(me) });
    },
    [state, override, qc],
  );

  const apiValue = useMemo<SessionApi | null>(() => {
    if (state.status !== 'ready') return null;
    const s = state.session;
    return {
      ...s,
      hasTask: (task) => (Array.isArray(task) ? task.some((t) => s.tasks.has(t)) : s.tasks.has(task)),
      switchOrg,
      signOut,
    };
  }, [state, switchOrg, signOut]);

  let content: ReactNode;
  switch (state.status) {
    case 'loading':
      content = <LoadingScreen />;
      break;
    case 'no-account':
      content = <NoAccountScreen email={state.email} onSignOut={signOut} />;
      break;
    case 'error':
      content = <ErrorScreen message={state.message} requestId={state.requestId} onRetry={() => setAttempt((n) => n + 1)} onSignOut={signOut} />;
      break;
    default:
      content = children;
  }

  return (
    <AuthStateContext.Provider value={state}>
      <SessionContext.Provider value={apiValue}>{content}</SessionContext.Provider>
    </AuthStateContext.Provider>
  );
}

/** The ready session. Throws outside a ready AuthProvider — guard routes render only when ready. */
export function useSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside a ready <AuthProvider>');
  return ctx;
}

export function useAuthState(): AuthState {
  return useContext(AuthStateContext);
}
