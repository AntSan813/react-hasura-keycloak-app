import {
  from,
  HttpLink,
  ApolloLink,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

import keycloak from "./keycloak";

// Function to create the authorization header
const createAuthHeader = async () => {
  if (typeof window !== "undefined" && keycloak) {
    await keycloak.updateToken(30); // Refresh the token if needed
    return { Authorization: `Bearer ${keycloak.token}` };
  }

  // Return an empty header object for server-side rendering
  return {};
};

// Create an Apollo Link for handling HTTP requests
const httpLink = new HttpLink({
  uri: "http://192.168.1.37:8080/v1/graphql", // Your Hasura endpoint
  credentials: "include",
  fetch,
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  // Here you can handle errors, for example logging or sending to an error tracking service
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
        operation.setContext({ headers });
        return forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
      })
      .catch(observer.error.bind(observer));
  });
});

export default function createApolloClient(initialState) {
  return new ApolloClient({
    link: from([authMiddleware, errorLink, httpLink]),
    cache: new InMemoryCache().restore(initialState),
    ssrMode: typeof window === "undefined",
  });
}
