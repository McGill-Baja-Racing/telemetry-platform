import { expect, test } from "vitest";
import { align, type LapData } from "./align.ts";

/** A lap of `metres` in `seconds` at a steady speed, from `start`, with a GPS fix every second. */
function steadyLap(start: number, seconds: number, metres: number, value: (t: number) => number) {
  const fixes = Array.from({ length: seconds + 1 }, (_, i) => i);
  const time = Array.from({ length: seconds * 10 + 1 }, (_, i) => start + i / 10);
  return {
    lap: { start, end: start + seconds, distance: metres },
    track: {
      time: fixes.map((t) => start + t),
      distance: fixes.map((t) => 500 + (t * metres) / seconds),
    },
    samples: { time, values: { s: time.map((t) => value(t - start)) } },
  } satisfies LapData;
}

// 100 m in 10 s with a spike at 5 s, against 110 m in 12 s.
const laps: [LapData, LapData] = [
  steadyLap(100, 10, 100, (t) => (t === 5 ? 9 : 1)),
  steadyLap(200, 12, 110, () => 2),
];

test("aligns two laps by distance, the second stretched to the first one's length", () => {
  const { x, values, delta } = align("distance", laps, 20);
  expect(x).toHaveLength(20);
  expect([x[0], x.at(-1)]).toEqual([0, 100]);
  expect(values[0].s.filter((v) => v === 9)).toHaveLength(1);
  expect(values[1].s.every((v) => v === 2)).toBe(true);
  // The second lap is 20 % slower all the way, and ends 2 s behind.
  expect(delta[0]).toBe(0);
  expect(delta[10]).toBeCloseTo(-0.02 * x[10]);
  expect(delta.at(-1)).toBeCloseTo(-2);
});

test("aligns two laps by time, the shorter one ending first", () => {
  const { x, values, delta } = align("time", laps, 24);
  expect(x.at(-1)).toBe(12);
  expect(values[0].s.at(-1)).toBeNull();
  expect(values[1].s.at(-1)).toBe(2);
  // Where the first lap is after `t` seconds, the second lap gets after 1.2 t.
  expect(delta[19]).toBeCloseTo(-0.2 * x[19]);
  expect(delta.at(-1)).toBeNull();
});
