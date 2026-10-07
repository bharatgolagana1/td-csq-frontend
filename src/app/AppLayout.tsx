import { AuthProvider } from '@/auth/session';
import { AppShell } from '@/shell/AppShell';

/**
 * Authenticated tree: Keycloak + /me, then the shell with the route outlet.
 * The CycleStrip is wired by the sampling/dashboard agent from GET /cycles/current;
 * until then the shell renders without it.
 */
export function AppLayout() {
  return (
    <AuthProvider>
      <AppShell cycle={null} />
    </AuthProvider>
  );
}
