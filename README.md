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

## Collecting logs from the car

Join the car's Wi-Fi (`BajaDAQ`) and run `pnpm dev`. The server asks the master board for its logs every 10 seconds, downloads each new one once, and imports it into the database. The app lists the imported recordings and shows the download in progress.

- Only completed logs are collected: the one being recorded shows up after Stop.
- Each hour of running is about 80 MB to download: the `.bin` log and its `.utc` GPS time companion. The master's firmware must serve `.utc` files (`format=utc`).
- A renamed log is recognized by its content and not imported twice.
- The master's address is `MASTER_URL` in `server/.env`. Remove that line to turn the collector off, as on the cloud server.
- To see each check, the download speed and the import time, run `NODE_DEBUG=collector pnpm dev`.

## Commands

| Command                            | What it does                                                               |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                         | database, then frontend and backend, which reload on save                  |
| `pnpm db`                          | database only, for migrations or Drizzle Studio                            |
| `pnpm check`                       | lint, format check and type-check (what CI runs)                           |
| `pnpm fix`                         | format and fix what Biome can                                              |
| `pnpm test`                        | tests, in their own `telemetry_test` database (needs `pnpm db`)            |
| `pnpm build`, then `pnpm start`    | production: one process serves the API and the built frontend on port 3000 |
| `pnpm --filter server db:generate` | turn changes in `db/schema.ts` into a migration                            |
| `pnpm --filter server db:migrate`  | apply migrations                                                           |
| `pnpm --filter server db:studio`   | browse the database                                                        |

## Where things go

```
server/src/index.ts     starts the server
server/src/app.ts       mounts every feature's routes; their types feed the frontend
server/src/env.ts       environment variables, checked at startup
server/src/db/          Drizzle schema and migrations
server/src/master/      the master board: its HTTP API and the format of its log files
server/src/collector/   pulls new logs from the master
server/src/recordings/  imports logs, and serves recordings and their samples to the charts
web/src/main.ts         starts the frontend
web/src/pages/          one file per page; the routes are generated from the file names
web/src/navigation.ts   the sidebar; an entry appears once its page exists
web/src/style.css       the design's colours, type sizes, radii and shadows
web/src/components/     the building blocks (ui/), the chart (chart/), the sidebar and car bar (shell/)
web/src/api.ts          typed client for the API
```

Group code by feature, not by layer: everything about recordings is in `server/src/recordings/`.

Query the database with Drizzle (`db`). The raw `sql` client is only for what Drizzle cannot write, such as `COPY` and TimescaleDB's `time_bucket`.

## Building a page

Every page is made of the same building blocks. Open `/design-system` in the app to see each one with its name.

- Start with `<UiPage title="…">`, split it with `<UiSection title="…">`, and pick from `web/src/components/ui/`: `UiButton`, `UiSelect`, `UiTabs`, `UiTable`, `UiFigures` and the rest.
- Colours are the design's tokens: `bg-screen`, `text-muted`, `border-line`, `bg-axis-z`. Tailwind's own palette is removed, and the light theme swaps the same names, so no `dark:` class is needed.
- Measured values go in `<UiValue value="48.4" unit="km/h" />`: tabular, slightly condensed digits, with the unit after.
- Read the API with `parseResponse(client.api.recordings.$get())` from `hono/client`: it throws on an error, so a page never shows an error body as data.
- Red (`live`) is only for what is live and for actions on the car, never for a data series.
- Icons come from `@lucide/vue`, such as `<Download />` inside a button. The mono font is only for file names, signal keys and formulas.
