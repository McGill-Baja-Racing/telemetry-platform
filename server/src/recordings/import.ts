import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { sql } from "../db/index.ts";
import type { SignalInfo } from "../master/client.ts";
import { decodedUnits, type FirstUtc, readSamples, type Sample, summarize } from "./samples.ts";

const COPY_BATCH_ROWS = 5_000;

export type LogFile = {
  name: string;
  path: string;
  sha256: string;
  signals: Map<number, SignalInfo>;
  firstUtc: FirstUtc | null;
};

/**
 * Imports a `.bin` log as a recording, unless one with the same content exists. Reads the file
 * twice: the GPS clock offset must be known before copying the first sample.
 */
export async function importRecording(file: LogFile): Promise<{ id: number; isNew: boolean }> {
  const [existing] = await sql<{ id: number }[]>`
    select id from recordings where sha256 = ${file.sha256}
  `;
  if (existing) return { id: existing.id, isNew: false };

  const samples = () => readSamples(createReadStream(file.path));
  const summary = await summarize(samples(), file.firstUtc);
  if (summary.sampleCount === 0) throw new Error(`${file.name} has no samples`);
  const offsetMs = summary.clockOffsetMs ?? 0;

  return sql.begin(async (tx) => {
    const [{ id }] = await tx<{ id: number }[]>`
      insert into recordings ${tx({
        name: file.name,
        sha256: file.sha256,
        started_at: new Date(offsetMs + summary.firstTimestampMs).toISOString(),
        ended_at: new Date(offsetMs + summary.lastTimestampMs).toISOString(),
        gps_time: summary.clockOffsetMs !== null,
        sample_count: summary.sampleCount,
      })}
      returning id
    `;

    const signals = [...summary.canIds].flatMap((canId) => {
      const info = file.signals.get(canId);
      return info ? [{ can_id: canId, ...info, units: decodedUnits(canId, info.units) }] : [];
    });
    if (signals.length > 0) {
      await tx`
        insert into signals ${tx(signals)}
        on conflict (can_id) do update
        set name = excluded.name, node = excluded.node, units = excluded.units
      `;
    }

    const copy = await tx`copy samples (time, recording_id, can_id, value) from stdin`.writable();
    await pipeline(Readable.from(copyRows(samples(), id, offsetMs)), copy);

    return { id, isNew: true };
  });
}

/** Sends rows in batches: one write per row made `COPY` 4× slower. */
async function* copyRows(samples: AsyncIterable<Sample>, recordingId: number, offsetMs: number) {
  let batch = "";
  let rows = 0;
  for await (const sample of samples) {
    const time = new Date(offsetMs + sample.timestampMs).toISOString();
    batch += `${time}\t${recordingId}\t${sample.canId}\t${sample.value}\n`;
    rows++;
    if (rows === COPY_BATCH_ROWS) {
      yield batch;
      batch = "";
      rows = 0;
    }
  }
  if (batch) yield batch;
}
