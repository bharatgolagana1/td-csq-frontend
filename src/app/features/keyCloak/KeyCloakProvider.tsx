import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keyCloak'; // Ensure this is the correct import path
import { useUserInfo } from '../../context/UserInfoContext'; // Adjust path as needed
import Loader from '../../shared/components/loader/Loader'; // Import the Loader component

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
        console.log('Keycloak event: onAuthSuccess');
        
        if (keycloak?.authenticated && keycloak.token) {
          try {
            console.log("Authenticated:", keycloak.authenticated);
            console.log("Token:", keycloak.token);

            const { data } = await axios.get('http://localhost:5000/me', {
              headers: {
                Authorization: `Bearer ${keycloak.token}`,
              },
            });
            setUserInfo(data); // Update the user info in context
            setAuthorized(true); // Mark user as authorized
          } catch (error) {
            console.error('Failed to fetch user info:', error);
            setAuthorized(false); // Mark user as not authorized
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
      };

      keycloak.onTokenExpired = () => {
        console.log('Keycloak event: onTokenExpired');
        keycloak.updateToken(30).catch(() => {
          console.log('Failed to refresh token');
          keycloak.logout();
        });
      };
    }
  }, [keycloakInitialized, setUserInfo]);

  return (
    <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions}>
      {loading ? (
        <Loader /> // Display the loader while waiting for /me response
      ) : authorized ? (
        children
      ) : (
        <div>User not authorized</div>
      )}
    </ReactKeycloakProvider>
  );
};

export default KeycloakProvider;
