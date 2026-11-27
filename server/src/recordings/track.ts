import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import { samples } from "../db/schema.ts";
import { divisorOf } from "./units.ts";

/** Logged at the same time as each other and as GPS speed. */
const CAN_ID_LATITUDE = 0x701;
const CAN_ID_LONGITUDE = 0x702;

const METRES_PER_DEGREE = 111_195;
/** A start line picked further than this from every fix is not on the track. */
const MAX_PICK_METRES = 30;
const GATE_HALF_WIDTH_METRES = 15;
/** Ignores the car rolling back and forth over the line. */
const MIN_LAP_METRES = 50;

export type Track = {
  /** Seconds from the start of the recording, one per GPS fix. */
  time: number[];
  lat: number[];
  lon: number[];
  /** Metres driven since the first fix. */
  distance: number[];
};

type Point = { lat: number; lon: number };

export type Lap = { start: number; end: number; distance: number };

/** Every fix, about 2 MB for a 14 h run at 1 Hz: thin it out if runs get longer. */
export async function readTrack(recordingId: number, startMs: number): Promise<Track> {
  const rows = await db
    .select({ time: samples.time, canId: samples.canId, value: samples.value })
    .from(samples)
    .where(
      and(
        eq(samples.recordingId, recordingId),
        inArray(samples.canId, [CAN_ID_LATITUDE, CAN_ID_LONGITUDE]),
      ),
    )
    .orderBy(samples.time, samples.canId);

  const track: Track = { time: [], lat: [], lon: [], distance: [] };
  for (let i = 0; i + 1 < rows.length; i++) {
    const [latitude, longitude] = [rows[i], rows[i + 1]];
    const ms = latitude.time.getTime();
    if (latitude.canId !== CAN_ID_LATITUDE || longitude.canId !== CAN_ID_LONGITUDE) continue;
    if (longitude.time.getTime() !== ms) continue;
    const lat = latitude.value / divisorOf(CAN_ID_LATITUDE);
    const lon = longitude.value / divisorOf(CAN_ID_LONGITUDE);
    // Without a fix, the master logs 0, 0.
    if (lat === 0 && lon === 0) continue;
    const previous = track.lat.length - 1;
    const step =
      previous < 0
        ? 0
        : Math.hypot(
            (lat - track.lat[previous]) * METRES_PER_DEGREE,
            (lon - track.lon[previous]) * METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180),
          );
    track.time.push((ms - startMs) / 1000);
    track.lat.push(lat);
    track.lon.push(lon);
    track.distance.push((track.distance[previous] ?? 0) + step);
  }
  return track;
}

/**
 * Laps between crossings of a start line: a gate across the track at the fix closest to `start`,
 * counted only when crossed in the direction the car drove there. `gate` is null when `start` is
 * not on the track.
 */
export function findLaps(track: Track, start: Point): { gate: Point[] | null; laps: Lap[] } {
  const xScale = METRES_PER_DEGREE * Math.cos((start.lat * Math.PI) / 180);
  const x = track.lon.map((lon) => (lon - start.lon) * xScale);
  const y = track.lat.map((lat) => (lat - start.lat) * METRES_PER_DEGREE);
  const toPoint = (px: number, py: number) => ({
    lat: start.lat + py / METRES_PER_DEGREE,
    lon: start.lon + px / xScale,
  });

  let closest = -1;
  let closestDistance = MAX_PICK_METRES;
  for (let i = 0; i < x.length; i++) {
    const distance = Math.hypot(x[i], y[i]);
    if (distance < closestDistance) {
      closest = i;
      closestDistance = distance;
    }
  }
  if (closest < 0) return { gate: null, laps: [] };
  const before = Math.max(closest - 1, 0);
  const after = Math.min(closest + 1, x.length - 1);
  const length = Math.hypot(x[after] - x[before], y[after] - y[before]);
  if (length === 0) return { gate: null, laps: [] };

  // The direction of travel at the gate, and the gate's centre.
  const dx = (x[after] - x[before]) / length;
  const dy = (y[after] - y[before]) / length;
  const cx = x[closest];
  const cy = y[closest];

  const crossings: { time: number; distance: number }[] = [];
  for (let i = 0; i + 1 < x.length; i++) {
    const from = (x[i] - cx) * dx + (y[i] - cy) * dy;
    const to = (x[i + 1] - cx) * dx + (y[i + 1] - cy) * dy;
    if (!(from < 0 && to >= 0)) continue;
    const f = -from / (to - from);
    const across =
      (x[i] + f * (x[i + 1] - x[i]) - cx) * -dy + (y[i] + f * (y[i + 1] - y[i]) - cy) * dx;
    if (Math.abs(across) > GATE_HALF_WIDTH_METRES) continue;
    const distance = track.distance[i] + f * (track.distance[i + 1] - track.distance[i]);
    const last = crossings.at(-1);
    if (last && distance - last.distance < MIN_LAP_METRES) continue;
    crossings.push({ time: track.time[i] + f * (track.time[i + 1] - track.time[i]), distance });
  }

  return {
    gate: [
      toPoint(cx + dy * GATE_HALF_WIDTH_METRES, cy - dx * GATE_HALF_WIDTH_METRES),
      toPoint(cx - dy * GATE_HALF_WIDTH_METRES, cy + dx * GATE_HALF_WIDTH_METRES),
    ],
    laps: crossings.slice(1).map((end, i) => ({
      start: crossings[i].time,
      end: end.time,
      distance: end.distance - crossings[i].distance,
    })),
  };
}
