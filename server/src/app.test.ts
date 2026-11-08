import { expect, test } from "vitest";
import { app } from "./app.ts";

test("GET /api/health", async () => {
  const res = await app.request("/api/health");
  expect(await res.json()).toEqual({ ok: true });
});
