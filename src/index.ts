import { createSchema, createYoga } from "graphql-yoga";
import { resolvers } from "./graphql/resolvers";

const typeDefs = await Bun.file(
  new URL("./graphql/schema.graphql", import.meta.url),
).text();

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
});

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  fetch: yoga,
});

console.log(`GraphQL server running at http://localhost:${port}/graphql`);