import { zValidator } from "@hono/zod-validator";
import { desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.ts";
import { recordings, samples, signals } from "../db/schema.ts";
import { readSeries } from "./series.ts";
import { findLaps, readTrack } from "./track.ts";
import { unitsOf } from "./units.ts";

export const idParam = zValidator("param", z.object({ id: z.coerce.number().int() }));

const range = {
  /** Signal names, comma-separated. */
  signals: z
    .string()
    .min(1)
    .transform((names) => [...new Set(names.split(","))]),
  /** Seconds from the start of the recording; the whole recording by default. */
  from: z.coerce.number().min(0).default(0),
  to: z.coerce.number().min(0).optional(),
};

function inOrder<T extends z.ZodType<{ from: number; to?: number }>>(schema: T) {
  return schema.refine((query) => query.to === undefined || query.from < query.to, {
    message: "from must be before to",
  });
}

export const rangeQuery = inOrder(z.object(range));

const samplesQuery = inOrder(
  z.object({
    ...range,
    /** The most times the chart can draw, about its width in pixels. */
    points: z.coerce.number().int().min(2).max(10_000),
  }),
);

/** A point of the start line, in degrees. */
const lapsQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const listed = {
  id: recordings.id,
  name: recordings.name,
  startedAt: recordings.startedAt,
  endedAt: recordings.endedAt,
  gpsTime: recordings.gpsTime,
  sampleCount: recordings.sampleCount,
};

type Times = { startMs: number; endMs: number };

export async function recordingTimes(id: number): Promise<Times | undefined> {
  const [times] = await db
    .select({ startedAt: recordings.startedAt, endedAt: recordings.endedAt })
    .from(recordings)
    .where(eq(recordings.id, id));
  return times && { startMs: times.startedAt.getTime(), endMs: times.endedAt.getTime() };
}

/** A range in seconds from the start of the recording, in milliseconds since 1970. */
export function msRange(times: Times, from: number, to: number | undefined) {
  return {
    fromMs: Math.floor(times.startMs + from * 1000),
    toMs: to === undefined ? times.endMs : Math.ceil(times.startMs + to * 1000),
  };
}

/** The CAN ID of each signal name, or an error naming the unknown ones. */
export async function canIdsOf(names: string[]) {
  const rows = await db
    .select({ canId: signals.canId, name: signals.name })
    .from(signals)
    .where(inArray(signals.name, names));
  const canIds = new Map(rows.map((row) => [row.name, row.canId]));
  const unknown = names.filter((name) => !canIds.has(name));
  return { canIds, error: unknown.length > 0 ? `Unknown signals: ${unknown.join(", ")}` : null };
}

export const notFound = { error: "No such recording" };

export const recordingRoutes = new Hono()
  .get("/", async (c) => {
    const rows = await db.select(listed).from(recordings).orderBy(desc(recordings.startedAt));
    return c.json(rows);
  })
  .get("/:id", idParam, async (c) => {
    const { id } = c.req.valid("param");
    const [recording] = await db.select(listed).from(recordings).where(eq(recordings.id, id));
    if (!recording) return c.json(notFound, 404);
    const recorded = db
      .selectDistinct({ canId: samples.canId })
      .from(samples)
      .where(eq(samples.recordingId, id));
    const rows = await db
      .select()
      .from(signals)
      .where(inArray(signals.canId, recorded))
      .orderBy(signals.canId);
    return c.json({
      ...recording,
      signals: rows.map(({ canId, name, node, units }) => ({
        name,
        node,
        units: unitsOf(canId, units),
      })),
    });
  })
  .get("/:id/samples", idParam, zValidator("query", samplesQuery), async (c) => {
    const { id } = c.req.valid("param");
    const { signals: names, from, to, points } = c.req.valid("query");
    const times = await recordingTimes(id);
    if (!times) return c.json(notFound, 404);

    const { canIds, error } = await canIdsOf(names);
    if (error) return c.json({ error }, 400);

    return c.json(
      await readSeries({
        recordingId: id,
        startMs: times.startMs,
        signals: new Map(names.map((name) => [canIds.get(name) as number, name])),
        ...msRange(times, from, to),
        points,
      }),
    );
  })
  .get("/:id/track", idParam, async (c) => {
    const { id } = c.req.valid("param");
    const times = await recordingTimes(id);
    if (!times) return c.json(notFound, 404);
    return c.json(await readTrack(id, times.startMs));
  })
  .get("/:id/laps", idParam, zValidator("query", lapsQuery), async (c) => {
    const { id } = c.req.valid("param");
    const times = await recordingTimes(id);
    if (!times) return c.json(notFound, 404);
    return c.json(findLaps(await readTrack(id, times.startMs), c.req.valid("query")));
  });
