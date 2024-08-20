// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import keycloak from '../features/keyCloak/keyCloak';
import { getUserRoles, hasRole } from '../utils/auth';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole }) => {
  if (!keycloak.authenticated) {
    return <Navigate to="/" />; // Redirect to login page or any other appropriate page
  }

  const roles = getUserRoles();
  console.log('Access Roles:', roles); // Log the roles

  if (!hasRole(roles, requiredRole)) {
    return <Navigate to="/unauthorized" />; // Redirect to an unauthorized page or any other appropriate page
  }

  return element;
};

export default ProtectedRoute;
