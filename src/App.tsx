import { useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
import KeycloakProvider from './app/features/keyCloak/KeyCloakProvider';
import createRoutes from './app/routes';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Initially open

  const handleDrawerOpen = () => {
    setSidebarOpen(true); // Open the sidebar
  };

  const handleDrawerClose = () => {
    setSidebarOpen(false); // Close the sidebar
  };

  const routes = createRoutes(sidebarOpen, handleDrawerOpen, handleDrawerClose);
  const router = createBrowserRouter(routes);

  return (
    <ErrorBoundary>
      <KeycloakProvider>
        <RouterProvider router={router} />
      </KeycloakProvider>
    </ErrorBoundary>
  );
}

export default App;
