import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './KeyCloak';
import { useUserInfo } from '../../context/UserInfoContext';
import CircularProgress from '@mui/material/CircularProgress';

const initOptions = {
  onLoad: 'login-required',
};

const KeycloakProvider = ({ children }: { children: React.ReactNode }) => {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const { setUserInfo } = useUserInfo();

  useEffect(() => {
    if (!keycloakInitialized) {
      setKeycloakInitialized(true);

      keycloak.onAuthSuccess = async () => {
        if (keycloak?.authenticated && keycloak.token) {
          try {
            const { data } = await axios.get('http://localhost:5000/me', {
              headers: {
                Authorization: `Bearer ${keycloak.token}`,
              },
            });
            setUserInfo({
              id: data.id,
              selectedOrganization: data.organizationId,
              authorities: data.permissions,
              isInternalUser: !data.isVisitor,
              organizations: [data.organizationId],
              isActive: data.userStatus === 'active',
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              userName: data.userName,
              role: data.role,
            });
            setAuthorized(true);
          } catch (error) {
            console.error('Failed to fetch user info:', error);
            setAuthorized(false);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      };

      keycloak.onReady = () => {
        console.log('Keycloak event: onReady');
      };

      keycloak.onAuthError = (error) => {
        console.error('Keycloak event: onAuthError', error);
        setAuthorized(false);
        setLoading(false);
      };

      keycloak.onTokenExpired = () => {
        keycloak.updateToken(30).catch(() => {
          keycloak.logout();
        });
      };
    }
  }, [keycloakInitialized, setUserInfo, keycloak]);

  return (
    <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions}>
      {loading ? (
        <CircularProgress />
      ) : authorized ? (
        children
      ) : (
        <div>User not authorized</div>
      )}
    </ReactKeycloakProvider>
  );
};

export default KeycloakProvider;