import { zValidator } from "@hono/zod-validator";
import { desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.ts";
import { recordings, signals } from "../db/schema.ts";
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
    const rows = await db
      .select({
        id: recordings.id,
        name: recordings.name,
        startedAt: recordings.startedAt,
        endedAt: recordings.endedAt,
        gpsTime: recordings.gpsTime,
        sampleCount: recordings.sampleCount,
      })
      .from(recordings)
      .orderBy(desc(recordings.startedAt));
    return c.json(rows);
  })
  .get(
    "/:id/samples",
    zValidator("param", z.object({ id: z.coerce.number().int() })),
    zValidator("query", samplesQuery),
    async (c) => {
      const { id } = c.req.valid("param");
      const { signals: names, from, to, points } = c.req.valid("query");

      const [recording] = await db
        .select({ startedAt: recordings.startedAt, endedAt: recordings.endedAt })
        .from(recordings)
        .where(eq(recordings.id, id));
      if (!recording) return c.json({ error: "No such recording" }, 404);

      const rows = await db
        .select({ canId: signals.canId, name: signals.name })
        .from(signals)
        .where(inArray(signals.name, names));
      const canIds = new Map(rows.map((row) => [row.name, row.canId]));
      const unknown = names.filter((name) => !canIds.has(name));
      if (unknown.length > 0)
        return c.json({ error: `Unknown signals: ${unknown.join(", ")}` }, 400);

      const startMs = recording.startedAt.getTime();
      const endMs = recording.endedAt.getTime();
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
