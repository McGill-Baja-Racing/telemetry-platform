import { Readable } from "node:stream";
import { expect, test } from "vitest";
import { decodedUnits, firstUtc, readSamples, summarize } from "./samples.ts";

function record(canId: number, timestampMs: number, value: number) {
  const bytes = Buffer.alloc(16);
  bytes.writeUInt32LE(canId, 0);
  bytes.writeInt32LE(value, 8);
  bytes.writeUInt32LE(timestampMs, 12);
  return bytes;
}

function utc(...entries: number[]) {
  const bytes = Buffer.alloc(entries.length * 8);
  for (const [i, entry] of entries.entries()) bytes.writeBigInt64LE(BigInt(entry), i * 8);
  return bytes;
}

test("decodes the worked example from LOG_FORMAT.md", async () => {
  const log = Readable.from([Buffer.from("b100000000000000dc050000e8030000", "hex")]);

  expect(await Array.fromAsync(readSamples(log))).toEqual([
    { canId: 0x0b1, value: 1500, timestampMs: 1000 },
  ]);
});

test("decodes GPS speed in km/h", async () => {
  const log = Readable.from([Buffer.concat([record(0x700, 2500, 1250), record(0x123, 800, -42)])]);

  expect(await Array.fromAsync(readSamples(log))).toEqual([
    { canId: 0x700, value: 12.5, timestampMs: 2500 },
    { canId: 0x123, value: -42, timestampMs: 800 },
  ]);
  expect(decodedUnits(0x700, "km/h_x100")).toBe("km/h");
  expect(decodedUnits(0x0b1, "psi")).toBe("psi");
});

test("reads records split across chunks and drops an incomplete last one", async () => {
  const bytes = Buffer.concat([1000, 1010, 1020].map((time) => record(0x0b1, time, 1500)));
  const log = Readable.from([
    bytes.subarray(0, 10),
    bytes.subarray(10, 25),
    bytes.subarray(25, 40),
  ]);

  const samples = await Array.fromAsync(readSamples(log));
  expect(samples.map((sample) => sample.timestampMs)).toEqual([1000, 1010]);
});

test("finds the first GPS time in a .utc companion", async () => {
  const utcMs = Date.parse("2026-11-09T15:00:00.000Z");

  expect(await firstUtc(Readable.from([utc(0, 0), utc(utcMs, utcMs + 10)]))).toEqual({
    index: 2,
    utcMs,
  });
  expect(await firstUtc(Readable.from([utc(0, 0)]))).toBeNull();
});

test("dates the samples recorded before the GPS fix", async () => {
  const records = [record(0x0b1, 1000, 1500), record(0x700, 2500, 1250), record(0x123, 800, 42)];
  const utcMs = Date.parse("2026-11-09T15:00:00.000Z");

  const log = Readable.from([Buffer.concat(records)]);
  expect(await summarize(readSamples(log), { index: 1, utcMs })).toEqual({
    sampleCount: 3,
    firstTimestampMs: 800,
    lastTimestampMs: 2500,
    clockOffsetMs: utcMs - 2500,
    canIds: new Set([0x0b1, 0x700, 0x123]),
  });
});
