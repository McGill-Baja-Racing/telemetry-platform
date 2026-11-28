import { randomUUID } from "node:crypto";
import { parseResponse } from "hono/client";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, expect, test } from "vitest";
import { app } from "../app.ts";
import { sql } from "../db/index.ts";

const START_MS = Date.parse("2026-11-09T15:00:00.000Z");
const ENGINE_RPM = 187;
const ACCEL_Z = 181;
const GPS_SPEED = 1792;

let recordingId: number;

/**
 * 60 s at 10 Hz: engine speed steady at 3000 rpm except 6000 at 20 s and 1000 at 40 s, and
 * acceleration Z at 1 g (logged in mg) except a 4.1 g landing at 30 s. No GPS speed.
 */
beforeAll(async () => {
  const samples: { ms: number; canId: number; value: number }[] = [];
  for (let ms = 0; ms <= 60_000; ms += 100) {
    const rpm = ms === 20_000 ? 6000 : ms === 40_000 ? 1000 : 3000;
    samples.push(
      { ms, canId: ENGINE_RPM, value: rpm },
      { ms, canId: ACCEL_Z, value: ms === 30_000 ? 4100 : 1000 },
    );
  }

  await sql`
    insert into signals ${sql([
      { can_id: ENGINE_RPM, name: "engine_rpm", node: "engine_node_5", units: "rpm" },
      { can_id: ACCEL_Z, name: "mpu_accel_z", node: "mpu_node_3", units: "mg" },
      { can_id: GPS_SPEED, name: "gps_speed", node: "master_gps", units: "km/h" },
    ])}
    on conflict do nothing
  `;
  [{ id: recordingId }] = await sql<{ id: number }[]>`
    insert into recordings ${sql({
      name: "stats.bin",
      sha256: randomUUID(),
      started_at: new Date(START_MS).toISOString(),
      ended_at: new Date(START_MS + 60_000).toISOString(),
      gps_time: true,
      sample_count: samples.length,
    })}
    returning id
  `;
  await sql`
    insert into samples ${sql(
      samples.map(({ ms, canId, value }) => ({
        time: new Date(START_MS + ms).toISOString(),
        recording_id: recordingId,
        can_id: canId,
        value,
      })),
    )}
  `;
});

afterAll(async () => {
  await sql`delete from samples where recording_id = ${recordingId}`;
  await sql`delete from recordings where id = ${recordingId}`;
  await sql.end();
});

const client = testClient(app);

function get(query: { signals: string; from?: string; to?: string }, id = recordingId) {
  return client.api.recordings[":id"].stats.$get({ param: { id: String(id) }, query });
}

test("gives the lowest, highest and mean value of each signal, in physical units", async () => {
  const stats = await parseResponse(get({ signals: "engine_rpm,mpu_accel_z,gps_speed" }));
  expect(stats).toEqual({
    engine_rpm: { min: 1000, max: 6000, mean: expect.closeTo((3000 * 599 + 7000) / 601, 6) },
    mpu_accel_z: { min: 1, max: 4.1, mean: expect.closeTo((1000 * 600 + 4100) / 601 / 1000, 6) },
    gps_speed: null,
  });
});

test("keeps to the range", async () => {
  const stats = await parseResponse(
    get({ signals: "engine_rpm,mpu_accel_z", from: "25", to: "35" }),
  );
  expect(stats.engine_rpm).toEqual({ min: 3000, max: 3000, mean: 3000 });
  expect(stats.mpu_accel_z?.max).toBe(4.1);
});

test("rejects an unknown recording, an unknown signal and a reversed range", async () => {
  expect((await get({ signals: "engine_rpm" }, 2 ** 31 - 1)).status).toBe(404);

  const unknown = await get({ signals: "engine_rpm,warp_drive" });
  expect(unknown.status).toBe(400);
  expect(await unknown.json()).toEqual({ error: "Unknown signals: warp_drive" });

  expect((await get({ signals: "engine_rpm", from: "20", to: "10" })).status).toBe(400);
});
