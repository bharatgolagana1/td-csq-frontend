import React from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import createRoutes from './app/routes/index';

const App: React.FC = () => {
  const routes = createRoutes();
  const router = createBrowserRouter(routes);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default App;
