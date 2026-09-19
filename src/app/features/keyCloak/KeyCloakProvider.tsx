import React, { useCallback, useEffect, useState } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './KeyCloak';
import { useUserInfo } from '../../context/UserInfoContext';
import { api, ApiError } from '../../api/client';
import Orbis from '../../shared/orbis/Orbis';

const initOptions = { onLoad: 'login-required', pkceMethod: 'S256' } as const;

/** What GET /v1/orgs/memberships/mine returns. */
interface MembershipsMine {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  memberships: Array<{
    orgId: string;
    orgName?: string;
    roleClasses: string[];
    capabilities?: string[];
    status: string;
  }>;
}

const KeycloakProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<'loading' | 'ready' | 'no-access' | 'error'>('loading');
  const [detail, setDetail] = useState<string | null>(null);
  const { setUserInfo } = useUserInfo();

  const loadProfile = useCallback(async () => {
    try {
      const me = await api<MembershipsMine>('/v1/orgs/memberships/mine');
      const active = me.memberships.filter((m) => m.status === 'ACTIVE');

      if (active.length === 0) {
        // Authenticated with no membership is a real and recoverable state:
        // a registration awaiting approval. It is not an error.
        setState('no-access');
        return;
      }

      const primary = active[0]!;
      setUserInfo({
        id: me.userId,
        selectedOrganization: primary.orgId,
        authorities: primary.capabilities ?? primary.roleClasses,
        isInternalUser: true,
        organizations: active.map((m) => m.orgId),
        isActive: true,
        firstName: me.firstName ?? '',
        lastName: me.lastName ?? '',
        email: me.email ?? '',
        userName: me.email ?? '',
        role: primary.roleClasses[0] ?? '',
      });
      setState('ready');
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'UNAUTHENTICATED' || e.code === 'TOKEN_EXPIRED')) {
        keycloak.login();
        return;
      }
      // Previously any failure here rendered the bare words "User not
      // authorized", which reads as a rejected login when it is usually the
      // API being unreachable. Say which it is.
      setDetail(e instanceof ApiError ? `${e.message}${e.requestId ? ` (ref ${e.requestId})` : ''}` : null);
      setState('error');
    }
  }, [setUserInfo]);

  useEffect(() => {
    keycloak.onAuthSuccess = () => { void loadProfile(); };
    keycloak.onAuthError = () => { setState('error'); setDetail('Sign in failed.'); };
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.logout());
    };
  }, [loadProfile]);

  return (
    <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions}>
      {state === 'loading' && <Orbis fullScreen label="Signing you in" />}
      {state === 'ready' && children}
      {state === 'no-access' && (
        <div style={{ padding: 40, maxWidth: '52ch', margin: '0 auto', fontFamily: 'var(--csq-font)' }}>
          <h1 style={{ fontSize: 20, marginBottom: 10 }}>Your account is not active yet</h1>
          <p style={{ color: 'var(--csq-muted)', lineHeight: 1.6 }}>
            You are signed in, but your organisation has not been activated. A CSQ
            administrator approves each operator before its people can take part.
          </p>
          <button onClick={() => keycloak.logout()} style={{ marginTop: 18 }}>Sign out</button>
        </div>
      )}
      {state === 'error' && (
        <div style={{ padding: 40, maxWidth: '52ch', margin: '0 auto', fontFamily: 'var(--csq-font)' }}>
          <h1 style={{ fontSize: 20, marginBottom: 10 }}>Could not load your account</h1>
          <p style={{ color: 'var(--csq-muted)', lineHeight: 1.6 }}>
            You signed in successfully, but CSQ could not reach the service that
            holds your access. {detail}
          </p>
          <button onClick={() => { setState('loading'); void loadProfile(); }} style={{ marginTop: 18 }}>
            Try again
          </button>
        </div>
      )}
    </ReactKeycloakProvider>
  );
};

export default KeycloakProvider;
