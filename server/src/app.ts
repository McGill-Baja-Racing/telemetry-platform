import { Hono } from "hono";

/** Every API route. Keep the calls chained so `AppType` carries the route types to the frontend client. */
export const app = new Hono()
  .basePath("/api")
  .get("/health", (c) => c.json({ ok: true }));

export type AppType = typeof app;
