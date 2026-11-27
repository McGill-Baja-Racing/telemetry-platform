import { RECORD_BYTES, UTC_BYTES } from "./log-format.ts";

/** A `.bin` record, as the master writes it. */
export function record(canId: number, timestampMs: number, value: number) {
  const bytes = Buffer.alloc(RECORD_BYTES);
  bytes.writeUInt32LE(canId, 0);
  bytes.writeInt32LE(value, 8);
  bytes.writeUInt32LE(timestampMs, 12);
  return bytes;
}

/** `.utc` entries, as the master writes them: 0 until the GPS has a fix. */
export function utc(...entries: number[]) {
  const bytes = Buffer.alloc(entries.length * UTC_BYTES);
  for (const [i, entry] of entries.entries()) bytes.writeBigInt64LE(BigInt(entry), i * UTC_BYTES);
  return bytes;
}
