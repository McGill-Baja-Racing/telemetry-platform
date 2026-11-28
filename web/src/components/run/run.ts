import { formatClock } from "../../format.ts";

/** Seconds from the start of the run, and metres driven. */
export type Lap = { start: number; end: number; distance: number };

/** Values in physical units, aligned with `time` in seconds from the start of the run. */
export type Samples = { time: number[]; values: Record<string, (number | null)[]> };

/** The index of the last of the sorted `times` at or before `seconds`, or 0. */
export function indexAt(times: number[], seconds: number) {
  let found = 0;
  let low = 0;
  let high = times.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (times[middle] <= seconds) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

/** The index of the lap that `seconds` falls in, or -1. */
export function lapAt(laps: Lap[], seconds: number) {
  return laps.findIndex((lap) => lap.start <= seconds && seconds < lap.end);
}

/**
 * The lap a range of seconds lies in, and whether it is that whole lap. To the millisecond, as the
 * page's address keeps ranges.
 */
export function lapOf(laps: Lap[], [from, to]: [number, number]) {
  const ms = 0.001;
  const index = laps.findIndex((lap) => lap.start - ms <= from && to <= lap.end + ms);
  const lap = laps[index];
  return lap ? { index, lap, whole: from - lap.start < ms && lap.end - to < ms } : undefined;
}

export function bestLap(laps: Lap[]) {
  return laps.reduce<Lap | undefined>(
    (best, lap) => (!best || lap.end - lap.start < best.end - best.start ? lap : best),
    undefined,
  );
}

/** A run as the API lists it. Without GPS time, it is dated from when the master powered on. */
type Recording = { startedAt: string; endedAt: string; gpsTime: boolean };

/** Seconds. */
export function durationOf(run: { startedAt: string; endedAt: string }) {
  return (Date.parse(run.endedAt) - Date.parse(run.startedAt)) / 1000;
}

const startTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function formatStarted(run: Recording) {
  return run.gpsTime ? startTime.format(Date.parse(run.startedAt)) : "No GPS time";
}

/** What the run page and the runs preview say about a run: `distance` in metres, from its track. */
export function runFacts(run: Recording, distance: number | undefined, laps: Lap[]) {
  const facts: { label: string; value: string; unit?: string }[] = [
    { label: "Started", value: formatStarted(run) },
    { label: "Duration", value: formatClock(durationOf(run), false) },
  ];
  if (distance) facts.push({ label: "Distance", value: (distance / 1000).toFixed(1), unit: "km" });
  const best = bestLap(laps);
  if (best) {
    facts.push({
      label: "Laps",
      value: `${laps.length}, best ${formatClock(best.end - best.start)}`,
    });
  }
  return facts;
}
