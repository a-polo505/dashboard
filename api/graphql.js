const { ApolloServer, gql } = require('apollo-server-micro');

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

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = server.createHandler({ path: '/api/graphql' });