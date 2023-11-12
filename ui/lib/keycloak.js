import Keycloak from "keycloak-js";

let keycloak;

if (typeof window !== "undefined") {
  keycloak = new Keycloak({
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  });
}

export default keycloak;
