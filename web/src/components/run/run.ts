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

export function bestLap(laps: Lap[]) {
  return laps.reduce<Lap | undefined>(
    (best, lap) => (!best || lap.end - lap.start < best.end - best.start ? lap : best),
    undefined,
  );
}
