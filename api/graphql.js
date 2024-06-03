import { ApolloServer, gql } from "apollo-server-micro";
import { InMemoryLRUCache } from "apollo-server-caching";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const typeDefs = gql`
  type Currency {
    hello1: String
  }

  type Currency {
    hello2: String
  }

  type Query {
    currencies: [Currency]
    currenciesDiff: [CurrencyDiff]
  }
`;

const resolvers = {
  //   Query: {
  //     hello: () => 'Hello from Apollo GraphQL on Vercel!',
  //   },

  Query: {
    currencies: async () => {
      const client = new MongoClient(uri);
      try {
        await client.connect();
        const collection = client
          .db("yourDatabaseName")
          .collection("currencies");
        return await collection.find({}).toArray();
      } finally {
        await client.close();
      }
    },
    currenciesDiff: async () => {
      const client = new MongoClient(uri);
      try {
        await client.connect();
        const collection = client
          .db("yourDatabaseName")
          .collection("currenciesDiff");
        return await collection.find({}).toArray();
      } finally {
        await client.close();
      }
    },
  },
};

const cache = new InMemoryLRUCache();

const apolloServer = new ApolloServer({ typeDefs, resolvers, cache });

await apolloServer.start();

export default apolloServer.createHandler({ path: "/api/graphql" });
