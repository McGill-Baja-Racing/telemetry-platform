import { indexAt, type Lap, type Samples } from "../run/run.ts";

export type Axis = "distance" | "time";

/** A lap, the samples loaded for it, and its run's GPS track in seconds and metres. */
export type LapData = { lap: Lap; samples: Samples; track: { time: number[]; distance: number[] } };

type Values = Record<string, (number | null)[]>;

/** Two laps on one x axis, in metres or seconds into the lap. */
export type Aligned = {
  x: number[];
  values: [Values, Values];
  /** Seconds the first lap is behind the second there, negative when it is ahead. */
  delta: (number | null)[];
};

/** `ys` at `x` on the line through the points of the sorted `xs`, flat past either end. */
function interpolate(xs: number[], ys: number[], x: number) {
  const i = indexAt(xs, x);
  if (x <= xs[i] || i + 1 >= xs.length) return ys[i];
  return ys[i] + ((x - xs[i]) / (xs[i + 1] - xs[i])) * (ys[i + 1] - ys[i]);
}

/**
 * The lap's GPS fixes in seconds and metres into the lap, stretched to `length` metres: GPS
 * measures the same lap a few metres longer or shorter, and both laps must end together.
 */
function fixesOf({ lap, track }: LapData, length: number) {
  const start = interpolate(track.time, track.distance, lap.start);
  const scale = length / lap.distance;
  const time = [0];
  const distance = [0];
  for (let i = indexAt(track.time, lap.start) + 1; track.time[i] < lap.end; i++) {
    time.push(track.time[i] - lap.start);
    distance.push((track.distance[i] - start) * scale);
  }
  time.push(lap.end - lap.start);
  distance.push(length);
  return { time, distance };
}

/**
 * The values at `positions` in `cells` equal cells from 0 to `end`, two per cell: the lowest and
 * the highest in the order they happened, so a one-sample peak still shows. Null where a cell is
 * empty.
 */
function resample(positions: number[], values: (number | null)[], cells: number, end: number) {
  const low = new Array<number>(cells).fill(-1);
  const high = new Array<number>(cells).fill(-1);
  positions.forEach((position, i) => {
    const value = values[i];
    if (value === null) return;
    const cell = Math.min(Math.max(Math.floor((position / end) * cells), 0), cells - 1);
    if (low[cell] < 0 || value < (values[low[cell]] as number)) low[cell] = i;
    if (high[cell] < 0 || value > (values[high[cell]] as number)) high[cell] = i;
  });
  return low.flatMap((lowest, cell) => {
    const highest = high[cell];
    if (lowest < 0) return [null, null];
    return lowest <= highest
      ? [values[lowest], values[highest]]
      : [values[highest], values[lowest]];
  });
}

/**
 * Puts two laps on one axis of about `points` positions, from 0 to the first lap's length or the
 * longer lap's time. By distance, the second lap is stretched to the first one's length.
 */
export function align(axis: Axis, laps: [LapData, LapData], points: number): Aligned {
  const length = laps[0].lap.distance;
  const [a, b] = laps.map((lap) => fixesOf(lap, length));
  const durations = laps.map(({ lap }) => lap.end - lap.start);
  const end = axis === "distance" ? length : Math.max(...durations);
  const cells = Math.max(Math.floor(points / 2), 1);
  // Evenly from 0 to `end`, so the delta ends on the difference in lap time.
  const x = Array.from({ length: cells * 2 }, (_, i) => (i * end) / (cells * 2 - 1));

  const [first, second] = laps.map(({ lap, samples }, side) => {
    const fixes = side === 0 ? a : b;
    const into = samples.time.map((time) => time - lap.start);
    const positions =
      axis === "distance"
        ? into.map((time) => interpolate(fixes.time, fixes.distance, time))
        : into;
    const entries = Object.entries(samples.values);
    return Object.fromEntries(
      entries.map(([name, list]) => [name, resample(positions, list, cells, end)]),
    );
  });

  const delta = x.map((at) => {
    if (axis === "distance")
      return interpolate(a.distance, a.time, at) - interpolate(b.distance, b.time, at);
    if (at > durations[0]) return null;
    return at - interpolate(b.distance, b.time, interpolate(a.time, a.distance, at));
  });
  return { x, values: [first, second], delta };
}
