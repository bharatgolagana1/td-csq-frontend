import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "https://auth.tinydata.in/",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "csq",
  clientId:  import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'csq-frontend',
});

export default keycloak;