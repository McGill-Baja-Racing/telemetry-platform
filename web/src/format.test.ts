import { expect, test } from "vitest";
import { formatClock } from "./format.ts";

test("shows minutes, seconds and milliseconds", () => {
  expect(formatClock(518.512)).toBe("8:38.512");
  expect(formatClock(5)).toBe("0:05.000");
  expect(formatClock(60.05)).toBe("1:00.050");
  expect(formatClock(3725.2)).toBe("62:05.200");
  expect(formatClock(0.3)).toBe("0:00.300");
});

test("cuts whole seconds like a stopwatch, so both forms agree", () => {
  expect(formatClock(59.999)).toBe("0:59.999");
  expect(formatClock(59.999, false)).toBe("0:59");
  expect(formatClock(518.9, false)).toBe("8:38");
});
