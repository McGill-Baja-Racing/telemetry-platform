import { expect, test } from "vitest";
import { bestLap, indexAt, lapAt } from "./run.ts";

test("finds the last time at or before a moment", () => {
  const times = [0, 0.5, 1, 1, 2];
  expect(indexAt(times, 1)).toBe(3);
  expect(indexAt(times, 1.9)).toBe(3);
  expect(indexAt(times, 2)).toBe(4);
  expect(indexAt(times, 9)).toBe(4);
  expect(indexAt(times, -1)).toBe(0);
  expect(indexAt([], 1)).toBe(0);
});

test("finds the lap of a moment and the fastest lap", () => {
  const laps = [
    { start: 5, end: 25, distance: 300 },
    { start: 25, end: 43, distance: 300 },
  ];
  expect(lapAt(laps, 25)).toBe(1);
  expect(lapAt(laps, 4)).toBe(-1);
  expect(lapAt(laps, 43)).toBe(-1);
  expect(bestLap(laps)).toBe(laps[1]);
  expect(bestLap([])).toBeUndefined();
});
