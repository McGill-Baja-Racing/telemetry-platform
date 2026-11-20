import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.ts";
import * as schema from "./schema.ts";

/** For `COPY` and the like. Drizzle disables its date conversion: pass dates as ISO strings. */
export const sql = postgres(env.DATABASE_URL);

export const db = drizzle({ client: sql, schema, casing: "snake_case" });
