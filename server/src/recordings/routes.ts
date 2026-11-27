import { zValidator } from "@hono/zod-validator";
import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, sql } from "../db/index.ts";
import { recordings } from "../db/schema.ts";
import { readSeries } from "./series.ts";

const samplesQuery = z
  .object({
    /** Signal names, comma-separated. */
    signals: z
      .string()
      .min(1)
      .transform((names) => [...new Set(names.split(","))]),
    /** Seconds from the start of the recording; the whole recording by default. */
    from: z.coerce.number().min(0).default(0),
    to: z.coerce.number().min(0).optional(),
    /** The most times the chart can draw, about its width in pixels. */
    points: z.coerce.number().int().min(2).max(10_000),
  })
  .refine((query) => query.to === undefined || query.from < query.to, "from must be before to");

export const recordingRoutes = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(recordings).orderBy(desc(recordings.startedAt));
    return c.json(rows);
  })
  .get(
    "/:id/samples",
    zValidator("param", z.object({ id: z.coerce.number().int() })),
    zValidator("query", samplesQuery),
    async (c) => {
      const { id } = c.req.valid("param");
      const { signals: names, from, to, points } = c.req.valid("query");

      const [recording] = await sql<{ start_ms: number; end_ms: number }[]>`
        select
          (extract(epoch from started_at) * 1000)::float8 as start_ms,
          (extract(epoch from ended_at) * 1000)::float8 as end_ms
        from recordings where id = ${id}
      `;
      if (!recording) return c.json({ error: "No such recording" }, 404);

      const rows = await sql<{ can_id: number; name: string }[]>`
        select can_id, name from signals where name in ${sql(names)}
      `;
      const canIds = new Map(rows.map((row) => [row.name, row.can_id]));
      const unknown = names.filter((name) => !canIds.has(name));
      if (unknown.length > 0)
        return c.json({ error: `Unknown signals: ${unknown.join(", ")}` }, 400);

      const { start_ms: startMs, end_ms: endMs } = recording;
      return c.json(
        await readSeries({
          recordingId: id,
          startMs,
          signals: new Map(names.map((name) => [canIds.get(name) as number, name])),
          fromMs: Math.floor(startMs + from * 1000),
          toMs: to === undefined ? endMs : Math.ceil(startMs + to * 1000),
          points,
        }),
      );
    },
  );
