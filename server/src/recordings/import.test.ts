import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { asc, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, expect, test } from "vitest";
import { db, sql } from "../db/index.ts";
import { recordings, samples, signals } from "../db/schema.ts";
import { record } from "../master/test-logs.ts";
import { importRecording } from "./import.ts";

const BRAKE = 0x0b1;
const UNNAMED = 0x123;
const FIX_MS = Date.parse("2026-11-09T15:00:00.000Z");

let folder: string;
let path: string;
const imported: number[] = [];

/** The master saw the brake at 1.0 s and 2.5 s, and an unnamed signal at 0.8 s, when the GPS got its fix. */
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), "import-test-"));
  path = join(folder, "log.bin");
  await writeFile(
    path,
    Buffer.concat([record(BRAKE, 1000, 1500), record(UNNAMED, 800, 42), record(BRAKE, 2500, 1600)]),
  );
});

afterAll(async () => {
  await sql`delete from samples where recording_id in ${sql(imported)}`;
  await sql`delete from recordings where id in ${sql(imported)}`;
  await sql`delete from signals where can_id = ${BRAKE}`;
  await sql.end();
  await rm(folder, { recursive: true });
});

async function importLog(sha256: string, firstUtc: { index: number; utcMs: number } | null) {
  const names = new Map([[BRAKE, { name: "test_brake", node: "test_node", units: "psi" }]]);
  const result = await importRecording({ name: "log.bin", path, sha256, signals: names, firstUtc });
  imported.push(result.id);
  return result;
}

test("dates every sample from the GPS fix and names the signals the master listed", async () => {
  const { id, isNew } = await importLog(randomUUID(), { index: 1, utcMs: FIX_MS });

  expect(isNew).toBe(true);
  const [recording] = await db.select().from(recordings).where(eq(recordings.id, id));
  expect(recording).toMatchObject({
    startedAt: new Date(FIX_MS),
    endedAt: new Date(FIX_MS + 1700),
    gpsTime: true,
    sampleCount: 3,
  });
  const rows = await db
    .select({ time: samples.time, canId: samples.canId, value: samples.value })
    .from(samples)
    .where(eq(samples.recordingId, id))
    .orderBy(asc(samples.time));
  expect(rows).toEqual([
    { time: new Date(FIX_MS), canId: UNNAMED, value: 42 },
    { time: new Date(FIX_MS + 200), canId: BRAKE, value: 1500 },
    { time: new Date(FIX_MS + 1700), canId: BRAKE, value: 1600 },
  ]);
  const named = await db
    .select({ canId: signals.canId, name: signals.name })
    .from(signals)
    .where(inArray(signals.canId, [BRAKE, UNNAMED]));
  expect(named).toEqual([{ canId: BRAKE, name: "test_brake" }]);
});

test("imports the same content once, and counts from power-on without a GPS fix", async () => {
  const sha256 = randomUUID();
  const first = await importLog(sha256, null);
  expect(await importLog(sha256, null)).toEqual({ id: first.id, isNew: false });

  const [recording] = await db
    .select({ startedAt: recordings.startedAt, gpsTime: recordings.gpsTime })
    .from(recordings)
    .where(eq(recordings.id, first.id));
  expect(recording).toEqual({ startedAt: new Date(800), gpsTime: false });
});
