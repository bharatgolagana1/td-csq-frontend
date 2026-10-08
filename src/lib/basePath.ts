/* Base path. VITE_BASE_PATH ('/' for local dev, '/app/' in the production
   image, see vite.config.ts) becomes Vite's `base`, which the bundle reads as
   import.meta.env.BASE_URL. Inside the app nothing needs a prefix: the data
   router gets `basename` (app/router.tsx) and <Link to="/users"> or
   navigate('/') resolve through it. Only full-page redirects that leave the
   router (Keycloak sign-out) build a URL here. */

/** Router basename from the Vite base: '/app/' → '/app', '/' or '' → '/'. */
export function routerBasename(base: string = import.meta.env.BASE_URL): string {
  const trimmed = base.trim().replace(/\/+$/, '');
  if (trimmed === '') return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** The app root as an absolute path with a trailing slash ('/app/' or '/'). */
export function appRootPath(base: string = import.meta.env.BASE_URL): string {
  const name = routerBasename(base);
  return name === '/' ? '/' : `${name}/`;
}

/** The app root on the current origin, e.g. https://dev.csq.aero/app/ (Keycloak redirectUri). */
export function appRootUrl(): string {
  return new URL(appRootPath(), window.location.origin).href;
}
