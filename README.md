# Bookmark Manager API

A GraphQL API for managing bookmarks and folders, built with TypeScript, Bun, GraphQL Yoga, Prisma, and PostgreSQL. Supports CRUD operations, cursor-based pagination, search, and validation.

## Tech Stack

- **TypeScript** — application language
- **Bun** — runtime, package manager, and test runner
- **GraphQL Yoga** — GraphQL server
- **Prisma** — ORM and database access
- **PostgreSQL** — relational database
- **Docker / Docker Compose** — local PostgreSQL environment

## Quick Start

1. Clone the repository
   ```bash
   git clone https://github.com/AkshitNest/Bookmark_manager.git
   cd bookmark-manager-api
   ```
2. Install dependencies
   ```bash
   bun install
   ```
3. Configure `.env` (see [Environment Variables](#environment-variables))
4. Start PostgreSQL
   ```bash
   docker compose up -d
   ```
5. Run Prisma migrations
   ```bash
   bun prisma migrate dev
   ```
6. Start the API
   ```bash
   bun run dev
   ```

The GraphQL API is available at `http://localhost:3000/graphql`.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |

`.env` is git-ignored and should never be committed. Use `.env.example` as a template — it contains no real credentials.

## Database

- PostgreSQL runs locally via Docker Compose.
- Prisma is the ORM; the schema lives at `prisma/schema.prisma`.
- Migrations live in `prisma/migrations/`.
- After changing the schema, generate and apply a migration with `prisma migrate dev`.

## API

### Queries

| Query | Description |
|---|---|
| `folders` | Returns all folders |
| `folder(id)` | Fetches a single folder by ID |
| `bookmarks(folderId?, search?, take?, cursor?)` | Returns bookmarks with optional folder filtering, search, and pagination |

Example:

```graphql
query {
  bookmarks(folderId: "FOLDER_ID", search: "graphql", take: 10) {
    items { id title url folderId }
    nextCursor
  }
}
```

### Mutations

| Mutation | Description |
|---|---|
| `createFolder(name)` | Creates a new folder |
| `createBookmark(title, url, folderId)` | Creates a bookmark in a folder |
| `updateBookmark(id, title?, url?, tags?)` | Updates an existing bookmark |
| `deleteBookmark(id)` | Deletes a bookmark |
| `moveBookmark(id, folderId)` | Moves a bookmark to another folder |

## Pagination

`bookmarks` uses cursor-based pagination:

- `take` defaults to `10` and is clamped between `1` and `50`.
- The resolver fetches `take + 1` records from Prisma; the extra record indicates whether another page exists.
- Only `take` records are returned to the client.
- The ID of the last returned bookmark becomes `nextCursor`.
- The next request passes that value as `cursor`.
- Prisma applies `cursor: { id: args.cursor }` with `skip: 1`, so the cursor record itself isn't repeated.
- Results are ordered by `createdAt asc, id asc` for deterministic pagination.
- `nextCursor` is `null` when no further records exist.

Example — page 1 returns `[A, B]` with `nextCursor: B.id`; requesting `take: 2, cursor: B.id` returns `[C, D]`.

## Search & Filtering

- `search` performs a case-insensitive substring match against bookmark `title` and `url`.
- `folderId` filters bookmarks to a single folder.
- `search`, `folderId`, and pagination can be combined freely.

```graphql
query {
  bookmarks(search: "postgres", folderId: "FOLDER_ID") {
    items { id title url }
    nextCursor
  }
}
```

## Validation & Error Handling

Input is validated in the resolvers before any database mutation:

- Empty or whitespace-only bookmark titles are rejected.
- URLs are validated with the `URL` constructor; malformed URLs are rejected.
- Updating, deleting, or moving a non-existent bookmark returns a "not found" error.
- Creating or moving a bookmark into a non-existent folder returns a "not found" error.

Errors are returned as meaningful GraphQL messages/codes, e.g. `VALIDATION_ERROR` and `NOT_FOUND`.

## Testing

Run all tests with `bun test`.

### Unit Tests

Resolver tests use mocked database dependencies with real assertions. Current coverage:

- Successful bookmark creation
- Empty title validation
- Invalid URL validation

### Integration Test

Runs against the real PostgreSQL database via Docker — Prisma and the database are not mocked. Flow: create folder → create bookmark → read it back → assert → clean up.

```bash
docker compose up -d
bun test
```

## Project Structure

```
bookmark-manager-api/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── graphql/
│   │   ├── __tests__/
│   │   │   ├── resolvers.test.ts
│   │   │   └── integration.test.ts
│   │   ├── resolvers.ts
│   │   └── schema.graphql
│   ├── db.ts
│   └── index.ts
├── docker-compose.yml
├── prisma.config.ts
├── package.json
├── .env.example
└── .gitignore
```

## Design Decisions

- **Schema-first GraphQL** via GraphQL Yoga for a clear, typed API contract.
- **Prisma + PostgreSQL** for type-safe, migration-driven data access.
- **Cursor-based pagination** (`take + 1` lookahead) instead of offset pagination, for stable performance on large datasets.
- **Stable ordering** (`createdAt asc, id asc`) to keep pagination deterministic.
- **Input validation** at the resolver layer, before any database write.
- **Unit + integration testing** to cover both resolver logic and real database behavior.

## How I'd Extend This

- **Authentication** — add session/JWT/OAuth-based auth so bookmarks and folders belong to individual users.
- **Authorization** — verify resource ownership in resolvers before read/update/delete/move operations.
- **Caching** — introduce Redis for frequently accessed bookmark lists, with invalidation on writes.
- **Search improvements** — move from substring matching to PostgreSQL full-text search or trigram indexes, with ranking.
- **Observability** — add structured logging, request IDs, metrics, and tracing for production diagnostics.
- **API versioning** — use GraphQL deprecation for gradual changes, with explicit versioning (e.g. `/graphql/v2`) for breaking ones.
- **Scaling** — run multiple stateless API instances behind a load balancer, with connection pooling and read replicas on PostgreSQL.

## Development Commands

| Command | Description |
|---|---|
| `bun install` | Install dependencies |
| `docker compose up -d` | Start PostgreSQL |
| `bun prisma migrate dev` | Run Prisma migrations |
| `bun run dev` | Start the development server |
| `bun test` | Run unit and integration tests |
| `bun run typecheck` | Run TypeScript type checking |
| `docker compose down` | Stop PostgreSQL |