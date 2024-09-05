import React from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import createRoutes from './app/routes/index';
import { UserInfoProvider } from './app/context/UserInfoContext';
import KeycloakProvider from './app/features/keyCloak/KeyCloakProvider';

const App: React.FC = () => {
  const routes = createRoutes();
  const router = createBrowserRouter(routes);

  return (
    <ErrorBoundary>
     <UserInfoProvider>
      <KeycloakProvider>
        <RouterProvider router={router} />
      </KeycloakProvider>
    </UserInfoProvider>
    </ErrorBoundary>
  );
};

export default App;
