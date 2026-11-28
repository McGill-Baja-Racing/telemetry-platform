import { zValidator } from "@hono/zod-validator";
import { and, avg, between, eq, inArray, max, min } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.ts";
import { samples } from "../db/schema.ts";
import { canIdsOf, idParam, msRange, notFound, rangeQuery, recordingTimes } from "./routes.ts";
import { divisorOf } from "./units.ts";

type Stats = { min: number; max: number; mean: number };

/**
 * The lowest, highest and mean value of each signal over a range of the recording, in physical
 * units, or null for a signal without samples there.
 */
export const statsRoutes = new Hono().get(
  "/:id/stats",
  idParam,
  zValidator("query", rangeQuery),
  async (c) => {
    const { id } = c.req.valid("param");
    const { signals: names, from, to } = c.req.valid("query");
    const times = await recordingTimes(id);
    if (!times) return c.json(notFound, 404);
    const { canIds, error } = await canIdsOf(names);
    if (error) return c.json({ error }, 400);

    const { fromMs, toMs } = msRange(times, from, to);
    const rows = await db
      .select({
        canId: samples.canId,
        min: min(samples.value),
        max: max(samples.value),
        mean: avg(samples.value).mapWith(Number),
      })
      .from(samples)
      .where(
        and(
          eq(samples.recordingId, id),
          inArray(samples.canId, [...canIds.values()]),
          between(samples.time, new Date(fromMs), new Date(toMs)),
        ),
      )
      .groupBy(samples.canId);

    const byCanId = new Map(rows.map((row) => [row.canId, row]));
    const stats = names.map((name): [string, Stats | null] => {
      const canId = canIds.get(name) as number;
      const row = byCanId.get(canId);
      if (!row || row.min === null || row.max === null) return [name, null];
      const divisor = divisorOf(canId);
      return [name, { min: row.min / divisor, max: row.max / divisor, mean: row.mean / divisor }];
    });
    return c.json(Object.fromEntries(stats));
  },
);
