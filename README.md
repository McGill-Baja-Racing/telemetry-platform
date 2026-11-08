# Baja Telemetry

Car telemetry, live in the pits and stored in the cloud: a Vue + Tailwind frontend and a Hono API in TypeScript, on PostgreSQL with TimescaleDB.

## Setup

You need Node 26 (`fnm install` reads `.node-version`), pnpm and Docker (OrbStack or Docker Desktop).

```bash
pnpm install
cp server/.env.example server/.env
pnpm db                               # PostgreSQL + TimescaleDB in Docker
pnpm --filter server db:migrate
pnpm dev                              # app on http://localhost:5173
```

Install the editor extensions VS Code suggests (Vue, Biome, Tailwind CSS): files are formatted on save.

## Commands

| Command                            | What it does                                                               |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                         | frontend and backend, both reload on save                                  |
| `pnpm check`                       | lint, format check and type-check (what CI runs)                           |
| `pnpm fix`                         | format and fix what Biome can                                              |
| `pnpm test`                        | tests                                                                      |
| `pnpm build`, then `pnpm start`    | production: one process serves the API and the built frontend on port 3000 |
| `pnpm --filter server db:generate` | turn changes in `db/schema.ts` into a migration                            |
| `pnpm --filter server db:migrate`  | apply migrations                                                           |
| `pnpm --filter server db:studio`   | browse the database                                                        |

## Where things go

```
server/src/index.ts   starts the server
server/src/app.ts     mounts every feature's routes; their types feed the frontend
server/src/env.ts     environment variables, checked at startup
server/src/db/        Drizzle schema and migrations
web/src/main.ts       starts the frontend
web/src/pages/        one file per page; the routes are generated from the file names
web/src/api.ts        typed client for the API
```

Group code by feature, not by layer: everything about sessions goes in `server/src/sessions/`.
