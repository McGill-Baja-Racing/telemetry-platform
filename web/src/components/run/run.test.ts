import { expect, test } from "vitest";
import { bestLap, indexAt, lapAt, lapOf, runFacts } from "./run.ts";

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

test("finds the lap a range lies in, to the millisecond", () => {
  const laps = [
    { start: 5.0004, end: 25.1236, distance: 300 },
    { start: 25.1236, end: 43, distance: 300 },
  ];
  expect(lapOf(laps, [5, 25.124])).toEqual({ index: 0, lap: laps[0], whole: true });
  expect(lapOf(laps, [30, 40])).toEqual({ index: 1, lap: laps[1], whole: false });
  expect(lapOf(laps, [20, 30])).toBeUndefined();
});

test("describes a run, with its distance and laps once they are known", () => {
  const run = {
    startedAt: "2026-11-08T14:32:00Z",
    endedAt: "2026-11-08T14:44:41Z",
    gpsTime: false,
  };
  expect(runFacts(run, undefined, [])).toEqual([
    { label: "Started", value: "No GPS time" },
    { label: "Duration", value: "12:41" },
  ]);
  const laps = [{ start: 5, end: 94.5, distance: 900 }];
  expect(runFacts(run, 4321, laps).slice(2)).toEqual([
    { label: "Distance", value: "4.3", unit: "km" },
    { label: "Laps", value: "1, best 1:29.500" },
  ]);
});
