import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import { isApiError } from '@/api/client';
import { ToastProvider } from '@/design/primitives/Toast/Toast';

import { ThemeProvider } from './theme';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          if (isApiError(error) && [400, 401, 403, 404, 409, 412].includes(error.status)) return false;
          return count < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

/** QueryClient → Theme → Toasts. Auth is a route-level provider (public routes skip it). */
export function AppProviders({ children, queryClient }: { children: ReactNode; queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
