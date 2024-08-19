import { useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
import createRoutes from './app/routes';
import { UserInfoProvider } from './app/context/UserInfoContext';
import KeycloakProvider from './app/features/keyCloak/KeyCloakProvider';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleDrawerOpen = () => {
    setSidebarOpen(true);
  };

  const handleDrawerClose = () => {
    setSidebarOpen(false);
  };

  const routes = createRoutes(sidebarOpen, handleDrawerOpen, handleDrawerClose);
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
}

export default App;
