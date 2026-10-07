import { AuthProvider } from '@/auth/session';
import { AppShell } from '@/shell/AppShell';
import { useCycleStripProps } from '@/shell/CycleStrip';

/** Inside the session: the operator strip from GET /cycles/current (null hides it). */
function ShellWithStrip() {
  const cycle = useCycleStripProps();
  return <AppShell cycle={cycle} />;
}

/**
 * Authenticated tree: Keycloak + /me, then the shell with the route outlet.
 * The CycleStrip is wired from GET /cycles/current for ACO sessions (shell/CycleStrip.tsx).
 */
export function AppLayout() {
  return (
    <AuthProvider>
      <ShellWithStrip />
    </AuthProvider>
  );
}
