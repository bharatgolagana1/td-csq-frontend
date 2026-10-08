import Keycloak from 'keycloak-js';

import { appRootUrl } from '@/lib/basePath';

/* One instance from VITE_KEYCLOAK_*; PKCE (S256), login-required.
   Nothing here touches the network until `initKeycloak()` is called, so the
   dev gallery and tests can import the module safely. Sign-in returns to the
   page that asked (keycloak-js defaults redirectUri to location.href, which
   already carries the base path); sign-out lands on the app root. */

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

let initPromise: Promise<boolean> | undefined;

/** Idempotent: React StrictMode double-invokes effects; keycloak.init must run once. */
export function initKeycloak(): Promise<boolean> {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
  }
  return initPromise;
}

/** Access token, refreshed when it expires within 30 s. Null when not signed in. */
export async function getAccessToken(): Promise<string | null> {
  if (!keycloak.authenticated) return null;
  try {
    await keycloak.updateToken(30);
  } catch {
    return null;
  }
  return keycloak.token ?? null;
}

/** Force a refresh (used once after a 401). Resolves false when it fails. */
export async function forceRefreshToken(): Promise<boolean> {
  if (!keycloak.authenticated) return false;
  try {
    return await keycloak.updateToken(-1);
  } catch {
    return false;
  }
}

/** Ends the Keycloak session and returns to the app root (https://host/app/ under VITE_BASE_PATH=/app/). */
export function signOutKeycloak(): Promise<void> {
  return keycloak.logout({ redirectUri: appRootUrl() });
}

/** Keeps the token fresh in the background; returns a stop function. */
export function startTokenRefresh(intervalMs = 20_000): () => void {
  const id = window.setInterval(() => {
    if (!keycloak.authenticated) return;
    keycloak.updateToken(60).catch(() => {
      // Refresh token gone: send the user back through Keycloak.
      keycloak.login();
    });
  }, intervalMs);
  return () => window.clearInterval(id);
}
