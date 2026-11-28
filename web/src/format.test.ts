import { expect, test } from "vitest";
import { formatChange, formatClock, formatDays, formatValue, isDay, localDay } from "./format.ts";

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

test("shows a dash for a missing value", () => {
  expect(formatValue(48.456, 2)).toBe("48.46");
  expect(formatValue(null, 1)).toBe("–");
  expect(formatValue(undefined, 0)).toBe("–");
});

test("signs a change, except one that rounds to zero", () => {
  expect(formatChange(1.25, 1)).toBe("+1.3");
  expect(formatChange(-0.3, 2)).toBe("−0.30");
  expect(formatChange(-0.004, 2)).toBe("0.00");
});

test("names the local day of a moment, and only accepts days that exist", () => {
  expect(localDay(new Date(2026, 10, 8, 23, 59).getTime())).toBe("2026-11-08");
  expect(localDay(new Date(2026, 0, 5).getTime())).toBe("2026-01-05");
  expect(isDay("2026-11-08")).toBe(true);
  for (const value of [
    "2026-02-30",
    "2026-13-01",
    "2026-11-8",
    "yesterday",
    "",
    undefined,
    ["2026-11-08"],
  ]) {
    expect(isDay(value)).toBe(false);
  }
});

test("shows a single day as one date and a range as two", () => {
  const day = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  expect(formatDays(["2026-11-08", "2026-11-08"])).toBe(day.format(new Date(2026, 10, 8)));
  expect(formatDays(["2026-11-01", "2026-11-08"])).not.toBe(day.format(new Date(2026, 10, 1)));
});
