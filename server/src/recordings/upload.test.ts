import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, expect, test } from "vitest";
import { app } from "../app.ts";
import { db, sql } from "../db/index.ts";
import { recordings } from "../db/schema.ts";
import { record, utc } from "../master/test-logs.ts";

const FIX_MS = Date.parse("2026-11-09T15:00:00.000Z");
const imported: number[] = [];

afterAll(async () => {
  await sql`delete from samples where recording_id in ${sql(imported)}`;
  await sql`delete from recordings where id in ${sql(imported)}`;
  await sql.end();
});

/** Sends the body 7 bytes at a time, so that chunks straddle the end of the `.utc`. */
function upload(name: string, parts: Buffer[], utcBytes: number) {
  const bytes = Buffer.concat(parts);
  const body = new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.subarray(i, i + 7));
      controller.close();
    },
  });
  const query = new URLSearchParams({ name, utcBytes: String(utcBytes) });
  return app.request(`/api/uploads?${query}`, { method: "POST", body, duplex: "half" });
}

test("imports a log and its .utc once, recognized by the same hash as the collector's", async () => {
  // A unique value, so that the content is new on every run of the test.
  const bin = Buffer.concat([record(0x0b1, 1000, Date.now() % 1e6), record(0x0b1, 2500, 1600)]);
  const companion = utc(0, FIX_MS);

  const response = await upload("upload.bin", [companion, bin], companion.length);
  expect(response.status).toBe(200);
  const { id, isNew } = (await response.json()) as { id: number; isNew: boolean };
  imported.push(id);
  expect(isNew).toBe(true);

  const [recording] = await db
    .select({
      sha256: recordings.sha256,
      startedAt: recordings.startedAt,
      gpsTime: recordings.gpsTime,
    })
    .from(recordings)
    .where(eq(recordings.id, id));
  const collected = createHash("sha256").update(companion).update(bin).digest("hex");
  expect(recording).toEqual({
    sha256: collected,
    startedAt: new Date(FIX_MS - 1500),
    gpsTime: true,
  });

  const again = await upload("renamed.bin", [companion, bin], companion.length);
  expect(await again.json()).toEqual({ id, isNew: false });
});

test("refuses a file without a whole sample", async () => {
  const response = await upload("empty.bin", [Buffer.alloc(10)], 0);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "empty.bin has no samples" });
});
