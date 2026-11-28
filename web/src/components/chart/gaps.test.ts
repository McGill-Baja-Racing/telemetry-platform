import { expect, test } from "vitest";
import { lastValue, withGaps } from "./gaps.ts";

test("draws across another signal's samples but keeps a real silence as a gap", () => {
  const time = [0, 0.1, 0.2, 0.3, 5, 5.1];
  expect(withGaps(time, [1, null, null, 2, null, 3])).toEqual([
    1,
    undefined,
    undefined,
    2,
    null,
    3,
  ]);
});

test("leaves nulls before the first sample and after the last", () => {
  expect(withGaps([0, 1, 2], [null, 1, null])).toEqual([null, 1, null]);
});

test("gives the last value before the index until a real silence", () => {
  const time = [0, 0.1, 0.2, 0.3, 5, 5.1];
  const values = [1, null, null, 2, null, null];
  expect(lastValue(time, values, 0)).toBe(1);
  expect(lastValue(time, values, 2)).toBe(1);
  expect(lastValue(time, values, 3)).toBe(2);
  expect(lastValue(time, values, 5)).toBeNull();
  expect(lastValue([], [], -1)).toBeNull();
});
