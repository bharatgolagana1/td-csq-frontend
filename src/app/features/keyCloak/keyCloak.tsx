import Keycloak from 'keycloak-js';
import { Environment } from '../../../environment/Environment';

const keycloak = new Keycloak({
  url: Environment.keyCloakUrl,
  realm: Environment.keyCloakRealm,
  clientId: Environment.KeyCloakClientId,
});

export default keycloak;
