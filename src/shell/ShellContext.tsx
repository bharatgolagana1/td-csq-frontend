import { createContext, type ReactNode, useContext, useMemo } from 'react';

/* Lets the same shell be mounted under a prefix (the dev gallery mounts it at
   /dev/design/shell) while nav.ts keeps absolute app paths. */

type ShellCtx = {
  basePath: string;
  href: (to: string) => string;
};

const Ctx = createContext<ShellCtx>({ basePath: '', href: (to) => to });

export function ShellProvider({ basePath = '', children }: { basePath?: string; children: ReactNode }) {
  const value = useMemo<ShellCtx>(() => {
    const base = basePath.replace(/\/+$/, '');
    return { basePath: base, href: (to) => (to === '/' ? base || '/' : `${base}${to}`) };
  }, [basePath]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell(): ShellCtx {
  return useContext(Ctx);
}
