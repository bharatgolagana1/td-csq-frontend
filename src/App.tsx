import React from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import createRoutes, { createPublicRoutes } from './app/routes/index';
import { UserInfoProvider } from './app/context/UserInfoContext';
import KeycloakProvider from './app/features/keyCloak/KeyCloakProvider';

/**
 * The assessor form is served entirely outside the Keycloak gate.
 *
 * KeycloakProvider runs with onLoad: 'login-required', which redirects before
 * React renders. A sampled freight forwarder has no account at all: the signed
 * link in their email or WhatsApp message IS their session. Leaving /assess
 * inside the provider sent them to a Keycloak login they could never complete,
 * which silently broke the entire customer assessment flow.
 */
const PUBLIC_PREFIXES = ['/assess'];

const isPublicRoute = (): boolean =>
  PUBLIC_PREFIXES.some((p) => window.location.pathname.startsWith(p));

const App: React.FC = () => {
  if (isPublicRoute()) {
    return (
      <ErrorBoundary>
        <RouterProvider router={createBrowserRouter(createPublicRoutes())} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <UserInfoProvider>
        <KeycloakProvider>
          <RouterProvider router={createBrowserRouter(createRoutes())} />
        </KeycloakProvider>
      </UserInfoProvider>
    </ErrorBoundary>
  );
};

export default App;
