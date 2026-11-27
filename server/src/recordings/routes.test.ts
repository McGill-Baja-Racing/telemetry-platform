import { randomUUID } from "node:crypto";
import { parseResponse } from "hono/client";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, expect, test } from "vitest";
import { app } from "../app.ts";
import { sql } from "../db/index.ts";

const START_MS = Date.parse("2026-11-09T15:00:00.000Z");
const ENGINE_RPM = 187;
const GPS_SPEED = 1792;
const GPS_LATITUDE = 1793;
const GPS_LONGITUDE = 1794;

/** The GPS track is a 50 m circle around this point, driven anticlockwise once every 20 s. */
const CENTRE = { lat: 45.5, lon: -73.6 };
const RADIUS_M = 50;
const METRES_PER_DEGREE = 111_195;

function onCircle(degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  return {
    lat: CENTRE.lat + (RADIUS_M * Math.sin(angle)) / METRES_PER_DEGREE,
    lon:
      CENTRE.lon +
      (RADIUS_M * Math.cos(angle)) / (METRES_PER_DEGREE * Math.cos((CENTRE.lat * Math.PI) / 180)),
  };
}

let recordingId: number;

/**
 * 100 s of engine RPM at 100 Hz, steady at 3000 except a spike then a dip 130 ms apart, and GPS
 * at 5 Hz that drops out between 60 and 80 s.
 */
beforeAll(async () => {
  const samples: { ms: number; canId: number; value: number }[] = [];
  for (let ms = 0; ms <= 100_000; ms += 10) {
    const value = ms === 42_370 ? 6000 : ms === 42_500 ? 1000 : 3000;
    samples.push({ ms, canId: ENGINE_RPM, value });
  }
  for (let ms = 0; ms <= 100_000; ms += 200) {
    if (ms > 60_000 && ms < 80_000) continue;
    const { lat, lon } = onCircle((ms / 20_000) * 360);
    samples.push(
      { ms, canId: GPS_SPEED, value: 20 },
      { ms, canId: GPS_LATITUDE, value: Math.round(lat * 1e7) },
      { ms, canId: GPS_LONGITUDE, value: Math.round(lon * 1e7) },
    );
  }

  await sql`
    insert into signals ${sql([
      { can_id: ENGINE_RPM, name: "engine_rpm", node: "engine_node_5", units: "rpm" },
      { can_id: GPS_SPEED, name: "gps_speed", node: "master_gps", units: "km/h" },
      { can_id: GPS_LATITUDE, name: "gps_latitude", node: "master_gps", units: "deg_e7" },
      { can_id: GPS_LONGITUDE, name: "gps_longitude", node: "master_gps", units: "deg_e7" },
    ])}
    on conflict do nothing
  `;
  [{ id: recordingId }] = await sql<{ id: number }[]>`
    insert into recordings ${sql({
      name: "test.bin",
      sha256: randomUUID(),
      started_at: new Date(START_MS).toISOString(),
      ended_at: new Date(START_MS + 100_000).toISOString(),
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

function get(
  query: { signals: string; points: string; from?: string; to?: string },
  id = recordingId,
) {
  return client.api.recordings[":id"].samples.$get({ param: { id: String(id) }, query });
}

function series(query: Parameters<typeof get>[0]) {
  return parseResponse(get(query));
}

test("reduces a long range to the lowest and highest value of each bucket, in time order", async () => {
  const { time, values } = await series({ signals: "engine_rpm,gps_speed", points: "200" });

  expect(time.length).toBeLessThanOrEqual(200);
  expect(time).toEqual(time.toSorted((a, b) => a - b));
  expect(time[0]).toBe(0);
  expect(values.engine_rpm).toHaveLength(time.length);
  expect(values.gps_speed).toHaveLength(time.length);

  const rpm = values.engine_rpm;
  expect(rpm).not.toContain(null);
  expect(rpm.indexOf(1000)).toBe(rpm.indexOf(6000) + 1);

  const gpsGap = time.filter((_, i) => values.gps_speed[i] === null);
  expect(gpsGap.length).toBeGreaterThan(0);
  expect(gpsGap.every((t) => t > 60 && t < 80)).toBe(true);
});

test("returns the raw samples of a short range, null where a signal has none", async () => {
  const short = await series({
    signals: "gps_speed,engine_rpm",
    from: "10",
    to: "10.05",
    points: "100",
  });

  expect(short).toEqual({
    time: [10, 10.01, 10.02, 10.03, 10.04, 10.05],
    values: {
      gps_speed: [20, null, null, null, null, null],
      engine_rpm: [3000, 3000, 3000, 3000, 3000, 3000],
    },
  });
});

test("rejects an unknown recording, an unknown signal and a reversed range", async () => {
  expect((await get({ signals: "engine_rpm", points: "100" }, 2 ** 31 - 1)).status).toBe(404);

  const unknown = await get({ signals: "engine_rpm,warp_drive", points: "100" });
  expect(unknown.status).toBe(400);
  expect(await unknown.json()).toEqual({ error: "Unknown signals: warp_drive" });

  const reversed = await get({ signals: "engine_rpm", points: "100", from: "20", to: "10" });
  expect(reversed.status).toBe(400);
});

test("lists the signals a recording has", async () => {
  const { name, signals } = await parseResponse(
    client.api.recordings[":id"].$get({ param: { id: String(recordingId) } }),
  );
  expect(name).toBe("test.bin");
  expect(signals.map((signal) => signal.name)).toEqual([
    "engine_rpm",
    "gps_speed",
    "gps_latitude",
    "gps_longitude",
  ]);
  expect(signals).toContainEqual({ name: "gps_latitude", node: "master_gps", units: "°" });
});

test("returns the GPS track in degrees with the distance driven", async () => {
  const { time, lat, lon, distance } = await parseResponse(
    client.api.recordings[":id"].track.$get({ param: { id: String(recordingId) } }),
  );
  expect(time).toHaveLength(402);
  expect([lat[0], lon[0]]).toEqual([
    expect.closeTo(onCircle(0).lat, 6),
    expect.closeTo(onCircle(0).lon, 6),
  ]);
  // 80 s of driving: the car is at the same place when the GPS drops out and when it comes back.
  expect(distance.at(-1)).toBeCloseTo(4 * 2 * Math.PI * RADIUS_M, -1);
});

test("counts laps from a start line on the track", async () => {
  const laps = (point: { lat: number; lon: number }) =>
    parseResponse(
      client.api.recordings[":id"].laps.$get({
        param: { id: String(recordingId) },
        query: { lat: String(point.lat), lon: String(point.lon) },
      }),
    );

  const { gate, laps: found } = await laps(onCircle(90));
  expect(gate).toHaveLength(2);
  expect(found.slice(0, 2)).toEqual([
    { start: expect.closeTo(5, 1), end: expect.closeTo(25, 1), distance: expect.closeTo(314, -1) },
    { start: expect.closeTo(25, 1), end: expect.closeTo(45, 1), distance: expect.closeTo(314, -1) },
  ]);

  expect(await laps({ lat: CENTRE.lat, lon: CENTRE.lon })).toEqual({ gate: null, laps: [] });
});
