import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { debuglog } from "node:util";
import {
  type Master,
  MasterError,
  type MasterLog,
  RECORD_BYTES,
  UTC_BYTES,
} from "../master/client.ts";
import { type FirstUtc, firstUtc } from "../recordings/samples.ts";

const IDLE_TIMEOUT_MS = 15_000;
const PROGRESS_LOG_INTERVAL_MS = 5_000;

const debug = debuglog("collector");

export type Download = { sha256: string; sampleCount: number; firstUtc: FirstUtc | null };

/**
 * Reads the `.utc` companion for the GPS time, then saves the `.bin` log to `path`. Together they
 * are 5× smaller than the master's CSV export, and the master does not have to format any rows.
 * Gives up when the master sends nothing for 15 s: that is how a lost Wi-Fi link shows up.
 */
export async function downloadLog(
  master: Master,
  log: MasterLog,
  path: string,
  onProgress: (fraction: number) => void,
): Promise<Download> {
  const hash = createHash("sha256");
  let bytes = 0;
  const total = log.sizeBytes + log.sampleCount * UTC_BYTES;
  const startedAt = performance.now();
  let loggedAt = startedAt;

  const controller = new AbortController();
  const idle = setTimeout(
    () => controller.abort(new Error(`no data for ${IDLE_TIMEOUT_MS / 1000} s`)),
    IDLE_TIMEOUT_MS,
  );
  async function* track(chunks: AsyncIterable<Uint8Array>) {
    for await (const chunk of chunks) {
      idle.refresh();
      hash.update(chunk);
      bytes += chunk.length;
      const progress = Math.min(bytes / total, 1);
      onProgress(progress);
      if (performance.now() - loggedAt > PROGRESS_LOG_INTERVAL_MS) {
        loggedAt = performance.now();
        debug(`${log.name}: ${Math.round(progress * 100)}%, ${transferred(bytes, startedAt)}`);
      }
      yield chunk;
    }
  }

  let sampleCount: number;
  let first: FirstUtc | null;
  try {
    // First, so that a master without `utc` fails before the large `.bin` is downloaded.
    const utc = await master.download(log.name, "utc", controller.signal).catch(withoutCompanion);
    first = utc ? await firstUtc(track(utc)) : null;
    const utcBytes = bytes;
    const body = await master.download(log.name, "bin", controller.signal);
    await pipeline(body, track, createWriteStream(path));
    sampleCount = Math.floor((bytes - utcBytes) / RECORD_BYTES);
  } finally {
    clearTimeout(idle);
  }

  debug(`${log.name}: downloaded ${transferred(bytes, startedAt)}`);
  return { sha256: hash.digest("hex"), sampleCount, firstUtc: first };
}

/** Logs recorded before the master stored GPS time have no `.utc` companion. */
function withoutCompanion(error: unknown): null {
  if (!(error instanceof MasterError)) throw error;
  if (error.status === 404) return null;
  if (error.status === 400) throw new Error("the master's firmware is too old to send .utc files");
  throw error;
}

function transferred(bytes: number, startedAt: number) {
  const seconds = (performance.now() - startedAt) / 1000;
  const megabytes = bytes / 1_000_000;
  const rate = megabytes / seconds;
  return `${megabytes.toFixed(1)} MB in ${seconds.toFixed(0)} s (${rate.toFixed(2)} MB/s)`;
}
