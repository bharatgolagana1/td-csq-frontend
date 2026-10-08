/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * VITE_BASE_PATH → Vite `base`: the public path the bundle is served under.
 * '/' (default) for local dev and `vite preview`; '/app/' in the production
 * image, where the host nginx keeps '/' for the landing site. Normalised to
 * one leading and one trailing slash so '/app', 'app/' and '/app/' all work.
 * The bundle reads it back as import.meta.env.BASE_URL (src/lib/basePath.ts).
 */
export function basePath(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

export default defineConfig(({ mode }) => {
  // .env files plus process.env (the Docker build passes VITE_* as ENV).
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    base: basePath(env['VITE_BASE_PATH']),
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            echarts: ['echarts', 'echarts-for-react'],
            vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
    },
  };
});
