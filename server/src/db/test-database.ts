import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { TestProject } from "vitest/node";

/** Creates the test database if needed and migrates it. Refuses any other database. */
export default async function setup(project: TestProject) {
  const url = new URL(project.config.env.DATABASE_URL ?? "");
  const name = url.pathname.slice(1);
  if (!name.endsWith("_test"))
    throw new Error(`Tests only run on a *_test database, not "${name}"`);

  const admin = new URL(url);
  admin.pathname = "/postgres";
  const server = postgres(admin.href);
  const [exists] = await server`select 1 from pg_database where datname = ${name}`;
  if (!exists) await server`create database ${server(name)}`;
  await server.end();

  const client = postgres(url.href, { onnotice: () => {} });
  const migrationsFolder = fileURLToPath(new URL("migrations", import.meta.url));
  await migrate(drizzle({ client }), { migrationsFolder });
  await client.end();
}
