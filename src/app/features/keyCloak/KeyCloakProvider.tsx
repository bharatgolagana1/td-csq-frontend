// src/app/features/keyCloak/KeycloakProvider.tsx
import React, { useEffect, useState } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keyCloak';

const initOptions = {
  onLoad: 'login-required',
};

const KeycloakProvider = ({ children }: { children: React.ReactNode }) => {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);

  useEffect(() => {
    if (!keycloakInitialized) {
      setKeycloakInitialized(true);

      keycloak.onAuthSuccess = () => {
        console.log('Keycloak event: onAuthSuccess');
      };

      keycloak.onReady = () => {
        console.log('Keycloak event: onReady');
        console.log('Logged in user:', keycloak.tokenParsed);
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
  }, [keycloakInitialized]);

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={initOptions}
      onEvent={(event, error) => {
        console.log(`Keycloak event ${event}`, error);
        if (event === 'onAuthSuccess') {
          console.log('Logged in user:', keycloak.tokenParsed);
        }
      }}
      onTokens={(tokens) => {
        console.log('Keycloak tokens', tokens);
      }}
    >
      {children}
    </ReactKeycloakProvider>
  );
};

export default KeycloakProvider;
