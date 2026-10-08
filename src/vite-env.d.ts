/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/consistent-type-definitions -- declaration merging needs interfaces */

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_API_BASE_URL: string;
  /** Public path the bundle is served under ('/' default, '/app/' in the image). Read it as BASE_URL (lib/basePath.ts). */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
