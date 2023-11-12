# react-hasura-keycloak-app

## **1. Introduction**

This guide focuses on setting up a complete self-hosted web application using Kubernetes, Hasura, Keycloak, and React with Apollo.

## **2. Setting Up Hasura and Keycloak**

Hasura is a powerful tool for instantly setting up a GraphQL backend over a new or existing PostgreSQL database. In our setup, we'll deploy Hasura using Kubernetes and Helm, and integrate it with Keycloak for JWT-based authentication.

### **Adding the Helm Chart**

For Hasura, we'll create a dedicated directory within our project and define Helm chart configuration files:

File: **`api/hasura/Chart.yaml`**

```yaml
apiVersion: v2
name: hasura
description: A Helm chart for Kubernetes
version: 1.0.0

dependencies:
  - name: graphql-engine
    version: "0.2.1"
    repository: "https://hasura.github.io/helm-charts"
```

_This file specifies the Hasura GraphQL Engine's Helm chart details._

File: **`api/hasura/values.yaml`**

```yaml
graphql-engine:
  config:
    metadataOnly: false
  secret:
    adminSecret: "your-admin-secret"
    eeLicenseKey: ""
    jwtSecret:
      {
        jwk_url: "http://keycloak-http.your-namespace.svc.cluster.local/auth/realms/your-realm/protocol/openid-connect/certs",
      }
  postgres:
    enabled: true
    auth:
      username: hasura
      password: your-postgres-password
      database: hasura
    persistence:
      enabled: true
      size: 10Gi
```

_In this configuration, the **`jwtSecret`** is particularly important. It points to the JWK (JSON Web Key) URL provided by Keycloak. Hasura uses this secret to verify the JWT tokens sent by the client, ensuring that they are valid and issued by the trusted Keycloak server. This setup is crucial for secure authentication and authorization._

### **Deploying Hasura**

Deploy Hasura using Kubernetes and Helm commands:

```
kubectl create namespace your-namespace --dry-run=client -o yaml | kubectl apply -f -
helm dependency build ./api/hasura
helm upgrade --install hasura ./api/hasura -f ./api/hasura/values.yaml --namespace your-namespace
```

_These commands perform the following actions:_

1. _Create a new Kubernetes namespace for Hasura._
2. _Build the necessary dependencies for the Hasura Helm chart._
3. _Deploy Hasura in the specified namespace using the configuration provided in **`values.yaml`**._

Once deployed, verify that the Hasura pods are up and running:

```
kubectl get pods -n your-namespace
```

### **Exposing Hasura Console**

To access the Hasura console from your local machine, use Kubernetes port forwarding:

```
kubectl port-forward -n your-namespace --address 0.0.0.0 $(kubectl get pod -n your-namespace -l app=hasura-graphql-engine -o jsonpath='{.items[0].metadata.name}') 8080:8080
```

_This command forwards the Hasura console's port to your local machine, making it accessible via **`localhost:8080`**._

## **3. Setting Up Keycloak**

Incorporating Keycloak for user authentication and authorization involves detailed setup, including configuring mappers to ensure seamless integration with Hasura.

### **Extending the Project Structure for Keycloak**

Create a directory for Keycloak with the necessary Helm configuration files:

File: **`api/keycloak/Chart.yaml`**

```yaml
apiVersion: v2
name: keycloak
description: A Helm chart for Kubernetes
version: 1.0.0

dependencies:
  - name: keycloak
    version: "18.4.3"
    repository: "https://codecentric.github.io/helm-charts"
```

_This YAML file defines the Helm chart for Keycloak._

### **Deploying Keycloak**

Deploy Keycloak using Helm within your Kubernetes cluster:

```
kubectl create namespace your-namespace --dry-run=client -o yaml | kubectl apply -f -
helm dependency build ./api/keycloak
helm upgrade --install keycloak ./api/keycloak --namespace your-namespace
```

_These commands set up Keycloak in the specified namespace._

Check the deployment status:

```
kubectl get pods -n your-namespace
```

### **Exposing Keycloak Admin Console**

Expose the Keycloak admin console for local access:

```
kubectl port-forward -n your-namespace --address 0.0.0.0 keycloak-0 8081:8080 &
```

_This command forwards the Keycloak port to your local machine._

### **Initial Keycloak Setup**

Create an admin account in the Keycloak admin console, then set up a new realm, roles, and a test user.

### **Configuring Mapper Configurations**

Configure the following mappers in Keycloak for proper JWT token generation:

1. **User ID Mapper**:
   - **Protocol**: openid-connect
   - **Name**: hasura-claim-user-id
   - **Mapper Type**: User Property
   - **Property**: id
   - **Token Claim Name**: **`https://hasura.io/jwt/claims.x-hasura-user-id`**
2. **Default Role Mapper**:
   - **Protocol**: openid-connect
   - **Name**: hasura-claim-default-role
   - **Mapper Type**: Hardcoded claim
   - **Token Claim Name**: **`https://hasura.io/jwt/claims.x-hasura-default-role`**
   - **Claim value**: [Your default role for users]
3. **Allowed Roles Mapper**:
   - **Protocol**: openid-connect
   - **Name**: hasura-claim-allowed-roles
   - **Mapper Type**: User Client Role
   - **Multivalued**: On
   - **Token Claim Name**: **`https://hasura.io/jwt/claims.x-hasura-allowed-roles`**
   - **Client ID**: [Your Hasura Client ID]

_These mappers are critical for ensuring that the JWT tokens include necessary claims for Hasura's authorization mechanism._

### **Testing Integration**

After configuring Keycloak, test the integration by obtaining a user token using Keycloak's token endpoint.

```bash
curl -d 'client_id=coffee-biz' -d 'username=antonio' -d 'password=password' -d 'grant_type=password' \
    'http://0.0.0.0:8081/auth/realms/coffee-biz/protocol/openid-connect/token' | \
 python3 -m json.tool
```

Use this token in the Hasura console or API requests to verify that authentication and authorization are functioning as expected.

![Untitled.png](%5BBlog%20Draft%20by%20ChatGPT%5D%20d585e3a9696c44bdbd35e17306f1c7e0/Untitled.png)

## **4. Setting Up the Frontend with Next.js**

### **Initializing the App**

Create a Next.js app and install dependencies.

### **Configuring Keycloak**

File: **`lib/keycloak.js`**

```jsx
import Keycloak from "keycloak-js";

let keycloak;

// Initialize Keycloak client-side
if (typeof window !== "undefined") {
  keycloak = new Keycloak({
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  });
}

export default keycloak;
```

_This JavaScript file configures Keycloak for client-side authentication. It initializes Keycloak with environment variables specifying the realm, URL, and client ID._

### **Configuring Apollo**

File: **`lib/apolloClient.js`**

```jsx
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import keycloak from "./keycloak";

// Function to create the authorization header
const createAuthHeader = async () => {
  // Add authorization token if in client-side environment
  if (typeof window !== "undefined" && keycloak) {
    await keycloak.updateToken(30); // Refresh token if near expiration
    return { Authorization: `Bearer ${keycloak.token}` };
  }
  return {};
};

// Define the HTTP link for GraphQL queries
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_HASURA_URL, // Use Hasura endpoint from environment variables
  credentials: "include",
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  // Log any GraphQL or network errors
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// Middleware to handle authorization
const authMiddleware = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    createAuthHeader()
      .then((headers) => {
        operation.setContext({ headers }); // Set the headers in the context
        return forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
      })
      .catch(observer.error.bind(observer));
  });
});

// Initialize Apollo Client
export default function createApolloClient(initialState) {
  return new ApolloClient({
    link: from([authMiddleware, errorLink, httpLink]), // Combine auth, error, and HTTP links
    cache: new InMemoryCache().restore(initialState),
    ssrMode: typeof window === "undefined", // Setup for server-side rendering
  });
}
```

_This file sets up the Apollo Client for interacting with the Hasura GraphQL API. It includes an authentication middleware to attach tokens to requests, error handling, and client initialization._

### **Adding Authentication to the App**

File: **`pages/_app.js`**

```jsx
import React, { useEffect } from "react";
import keycloak from "../lib/keycloak";

function MyApp({ Component, pageProps }) {
  // Handle authentication on component mount
  useEffect(() => {
    keycloak.init({ onLoad: "check-sso" }).then((authenticated) => {
      if (!authenticated) {
        keycloak.login(); // Redirect to login if not authenticated
      }
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

_This component wraps around all other pages in the Next.js app. It initializes Keycloak on the client side and redirects to the login page if the user is not authenticated._

### **Connecting Apollo Client to Landing Pages**

File: **`components/Landing.js`**

```jsx
import Link from "next/link";
import { withApollo } from "../lib/withApollo";

const Landing = () => {
  // Render the landing page content
  return <h2>Landing Page</h2>;
};

export default withApollo(Landing); // Enhance the component with Apollo Client
```

_This component represents the landing page. It is enhanced with the Apollo Client to enable GraphQL queries._
