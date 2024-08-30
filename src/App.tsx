import React from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import createRoutes from './app/features/routes';  // Ensure the correct path

const App: React.FC = () => {
  const routes = createRoutes(); // Call the function to get routes
  const router = createBrowserRouter(routes);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default App;
