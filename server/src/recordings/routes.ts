import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.ts";
import { recordings } from "../db/schema.ts";

export const recordingRoutes = new Hono().get("/", async (c) => {
  const rows = await db.select().from(recordings).orderBy(desc(recordings.startedAt));
  return c.json(rows);
});
