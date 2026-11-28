import { expect, test } from "vitest";
import { smooth } from "./smooth.ts";

test("averages the values around each one", () => {
  const time = [0, 1, 2, 3, 4];
  expect(smooth(time, [0, 0, 3, 0, 0], 2)).toEqual([0, 1, 1, 1, 0]);
  expect(smooth(time, [5, 5, 5, 5, 5], 2)).toEqual([5, 5, 5, 5, 5]);
});

test("keeps gaps and leaves nulls out of the means", () => {
  const time = [0, 1, 2, 5, 6];
  expect(smooth(time, [2, null, 4, 10, 20], 4)).toEqual([3, null, 3, 15, 15]);
});
