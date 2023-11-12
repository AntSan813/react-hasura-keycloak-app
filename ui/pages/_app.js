import React, { useEffect } from "react";

import keycloak from "../lib/keycloak"; // Adjust the path to your keycloak instance

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    keycloak.init({ onLoad: "check-sso" }).then((authenticated) => {
      if (!authenticated) {
        keycloak.login(); // Redirect to login
      }
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
