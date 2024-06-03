import { ApolloServer, gql } from 'apollo-server-micro';

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from Apollo GraphQL on Vercel!',
  },
};

const apolloServer = new ApolloServer({ typeDefs, resolvers });

await apolloServer.start();

export default apolloServer.createHandler({ path: '/api/graphql' });
