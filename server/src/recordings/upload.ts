import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { firstUtc, RECORD_BYTES } from "../master/log-format.ts";
import { importRecording } from "./import.ts";

const uploadQuery = z.object({
  /** The `.bin` file's name, which names the run. */
  name: z.string().trim().min(1).max(255),
  /** The size of the `.utc` companion sent before the `.bin`, or 0 without one. */
  utcBytes: z.coerce.number().int().min(0).default(0),
});

/**
 * A `.bin` log from the car's SD card, and its optional `.utc` companion, as one body: the
 * companion first, as the collector downloads them. A 14 h log is about 220 MB, so the body goes
 * to a temporary file and never sits in memory.
 */
export const uploadRoutes = new Hono().post("/", zValidator("query", uploadQuery), async (c) => {
  const { name, utcBytes } = c.req.valid("query");
  const body = c.req.raw.body;
  if (!body) return c.json({ error: "The request has no file" }, 400);

  const folder = await mkdtemp(join(tmpdir(), "baja-upload-"));
  try {
    const path = join(folder, "log.bin");
    const { sha256, binBytes, first } = await save(body, utcBytes, path);
    if (binBytes < RECORD_BYTES) return c.json({ error: `${name} has no samples` }, 400);
    // Signal names come from the master: an upload keeps the ones already stored.
    const signals = new Map();
    const recording = await importRecording({ name, path, sha256, signals, firstUtc: first });
    return c.json(recording, 200);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

/**
 * Hashes the `.utc` then the `.bin`, as the collector does, so that a log it collected is
 * recognized and not imported twice.
 */
async function save(body: ReadableStream<Uint8Array>, utcBytes: number, path: string) {
  const hash = createHash("sha256");
  let bytes = 0;
  async function* hashed() {
    for await (const chunk of body) {
      hash.update(chunk);
      bytes += chunk.length;
      yield chunk;
    }
  }
  const [utc, bin] = split(hashed(), utcBytes);
  const first = utcBytes > 0 ? await firstUtc(utc) : null;
  await pipeline(bin, createWriteStream(path));
  return { sha256: hash.digest("hex"), binBytes: bytes - utcBytes, first };
}

/** The first `bytes` of `input`, then the rest. Read them in that order. */
function split(input: AsyncIterator<Uint8Array>, bytes: number) {
  let left = bytes;
  let carried: Uint8Array | undefined;
  async function* head() {
    while (left > 0) {
      const next = await input.next();
      if (next.done) return;
      const part = next.value.subarray(0, left);
      if (part.length < next.value.length) carried = next.value.subarray(part.length);
      left -= part.length;
      yield part;
    }
  }
  async function* tail() {
    if (carried) yield carried;
    for (let next = await input.next(); !next.done; next = await input.next()) yield next.value;
  }
  return [head(), tail()] as const;
}
