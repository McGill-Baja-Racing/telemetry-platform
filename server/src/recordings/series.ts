import { sql } from "../db/index.ts";

export type Series = {
  /** Seconds from the start of the recording. */
  time: number[];
  /** One array per signal, aligned with `time`, `null` where the signal has no sample. */
  values: Record<string, (number | null)[]>;
};

type Query = {
  recordingId: number;
  startMs: number;
  /** Signal name by CAN ID, in the order the response lists them. */
  signals: Map<number, string>;
  fromMs: number;
  toMs: number;
  points: number;
};

/**
 * The samples between `fromMs` and `toMs`, in at most `points` times. When there are more, each
 * bucket of time keeps its lowest and highest value per signal, in the order they happened: a
 * one-sample peak such as a hard landing still shows.
 */
export async function readSeries(query: Query): Promise<Series> {
  const { recordingId, startMs, signals, points } = query;
  const from = new Date(query.fromMs).toISOString();
  const to = new Date(query.toMs).toISOString();
  const where = sql`
    recording_id = ${recordingId} and can_id in ${sql([...signals.keys()])}
    and time between ${from}::timestamptz and ${to}::timestamptz
  `;
  const series: Series = {
    time: [],
    values: Object.fromEntries([...signals.values()].map((name) => [name, []])),
  };
  const valuesOf = (canId: number) => series.values[signals.get(canId) as string];
  const addTime = (time: number) => {
    series.time.push(time);
    for (const values of Object.values(series.values)) values.push(null);
  };

  const raw = await sql<{ ms: number; can_id: number; value: number }[]>`
    select (extract(epoch from time) * 1000)::float8 as ms, can_id, value
    from samples where ${where}
    limit ${points + 1}
  `;
  if (raw.length <= points) {
    for (const sample of raw.sort((a, b) => a.ms - b.ms)) {
      const time = (sample.ms - startMs) / 1000;
      const values = valuesOf(sample.can_id);
      // Two samples of a signal at the same millisecond get a time each.
      if (series.time.at(-1) !== time || values.at(-1) !== null) addTime(time);
      values[values.length - 1] = sample.value;
    }
    return series;
  }

  // Whole milliseconds, rounded up so that a sample at `toMs` still falls in the last bucket.
  const bucketMs = Math.floor((query.toMs - query.fromMs) / Math.floor(points / 2)) + 1;
  const buckets = await sql<
    { ms: number; can_id: number; min: number; max: number; min_first: boolean }[]
  >`
    -- Grouping by the bucket itself, not by its conversion to milliseconds, is 10× faster.
    select (extract(epoch from bucket) * 1000)::float8 as ms, can_id, min, max, min_first
    from (
      select
        time_bucket(${bucketMs} * interval '1 millisecond', time, origin => ${from}::timestamptz)
          as bucket,
        can_id, min(value), max(value), first(time, value) <= last(time, value) as min_first
      from samples where ${where}
      group by 1, 2
    )
    order by bucket
  `;
  for (const bucket of buckets) {
    const time = (bucket.ms - startMs) / 1000;
    if (series.time.at(-2) !== time) {
      addTime(time);
      addTime((bucket.ms + bucketMs / 2 - startMs) / 1000);
    }
    const values = valuesOf(bucket.can_id);
    values[values.length - 2] = bucket.min_first ? bucket.min : bucket.max;
    values[values.length - 1] = bucket.min_first ? bucket.max : bucket.min;
  }
  return series;
}
