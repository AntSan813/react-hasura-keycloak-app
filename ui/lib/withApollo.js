import React from "react";
import { ApolloProvider } from "@apollo/react-hooks";

import createApolloClient from "./apolloClient";

let globalApolloClient = null;

const initApolloClient = (initialState) => {
  if (typeof window === "undefined") {
    // Server-side
    return createApolloClient(initialState);
  }

  // Client-side: Reuse client on the client-side
  if (!globalApolloClient) {
    globalApolloClient = createApolloClient(initialState);
  }

  return globalApolloClient;
};

export const withApollo = (PageComponent) => {
  return ({ apolloClient, apolloState, ...pageProps }) => {
    const client = apolloClient || initApolloClient(apolloState);
    return (
      <ApolloProvider client={client}>
        <PageComponent {...pageProps} />
      </ApolloProvider>
    );
  };
};
