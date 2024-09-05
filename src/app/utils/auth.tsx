import {jwtDecode} from 'jwt-decode';
import keycloak from '../features/keyCloak/KeyCloak';

interface ResourceAccess {
  roles: string[];
}

interface DecodedToken {
  resource_access?: {
    [key: string]: ResourceAccess;
  };
  realm_access?: {
    roles: string[];
  };
}

export const getUserRoles = (): string[] => {
  const token = keycloak.token;
  if (!token) return [];

  try {
    const decodedToken: DecodedToken = jwtDecode<DecodedToken>(token);
    console.log('Decoded Token:', decodedToken);

    const roles: string[] = [];

    if (decodedToken.resource_access) {
      for (const key in decodedToken.resource_access) {
        if (decodedToken.resource_access[key].roles) {
          roles.push(...decodedToken.resource_access[key].roles);
        }
      }
    }

    if (decodedToken.realm_access && decodedToken.realm_access.roles) {
      roles.push(...decodedToken.realm_access.roles);
    }

    console.log('User Roles:', roles);
    return roles;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return [];
  }
};

export const hasRole = (roles: string[], requiredRole: string): boolean => {
  return roles.includes(requiredRole);
};