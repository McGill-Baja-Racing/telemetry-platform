import { RECORD_BYTES, UTC_BYTES } from "../master/client.ts";

/** The master records GPS speed in km/h × 100; decoded samples carry km/h. */
const CAN_ID_GPS_SPEED = 0x700;

export type Sample = {
  canId: number;
  value: number;
  /** Master clock: milliseconds since it powered on. */
  timestampMs: number;
};

/** The first entry of a `.utc` companion with GPS time: the ones before the fix are 0. */
export type FirstUtc = { index: number; utcMs: number };

export type Summary = {
  sampleCount: number;
  firstTimestampMs: number;
  lastTimestampMs: number;
  /** GPS time minus master clock: constant within a log, it also dates samples before the fix. */
  clockOffsetMs: number | null;
  canIds: Set<number>;
};

/** Samples come in the order the master received them, not in time order. */
export async function* readSamples(input: AsyncIterable<Uint8Array>): AsyncGenerator<Sample> {
  for await (const records of wholeRecords(input, RECORD_BYTES)) {
    for (let offset = 0; offset < records.length; offset += RECORD_BYTES) {
      const canId = records.readUInt32LE(offset) & 0x7ff;
      const value = records.readInt32LE(offset + 8);
      yield {
        canId,
        value: canId === CAN_ID_GPS_SPEED ? value / 100 : value,
        timestampMs: records.readUInt32LE(offset + 12),
      };
    }
  }
}

export function decodedUnits(canId: number, units: string): string {
  return canId === CAN_ID_GPS_SPEED ? "km/h" : units;
}

/**
 * Reads to the end even after finding it, so the master finishes the download normally instead of
 * seeing the connection drop.
 */
export async function firstUtc(input: AsyncIterable<Uint8Array>): Promise<FirstUtc | null> {
  let found: FirstUtc | null = null;
  let index = 0;
  for await (const entries of wholeRecords(input, UTC_BYTES)) {
    for (let offset = 0; !found && offset < entries.length; offset += UTC_BYTES, index++) {
      const utcMs = entries.readBigInt64LE(offset);
      if (utcMs > 0n) found = { index, utcMs: Number(utcMs) };
    }
  }
  return found;
}

export async function summarize(
  samples: AsyncIterable<Sample>,
  firstUtc: FirstUtc | null,
): Promise<Summary> {
  let sampleCount = 0;
  let firstTimestampMs = Number.POSITIVE_INFINITY;
  let lastTimestampMs = Number.NEGATIVE_INFINITY;
  let clockOffsetMs: number | null = null;
  const canIds = new Set<number>();

  for await (const sample of samples) {
    if (sampleCount === firstUtc?.index) clockOffsetMs = firstUtc.utcMs - sample.timestampMs;
    sampleCount++;
    firstTimestampMs = Math.min(firstTimestampMs, sample.timestampMs);
    lastTimestampMs = Math.max(lastTimestampMs, sample.timestampMs);
    canIds.add(sample.canId);
  }

  return { sampleCount, firstTimestampMs, lastTimestampMs, clockOffsetMs, canIds };
}

/** Regroups chunks so that each holds whole records; an incomplete last record is dropped. */
async function* wholeRecords(input: AsyncIterable<Uint8Array>, size: number) {
  let rest = Buffer.alloc(0);
  for await (const chunk of input) {
    const bytes = Buffer.concat([rest, chunk]);
    const end = bytes.length - (bytes.length % size);
    rest = bytes.subarray(end);
    if (end > 0) yield bytes.subarray(0, end);
  }
}
