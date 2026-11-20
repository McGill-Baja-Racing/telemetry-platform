import { Hono } from "hono";

/** Keep the calls chained: `AppType` carries the route types to the frontend. */
export const app = new Hono().basePath("/api").get("/health", (c) => c.json({ ok: true }));

export type AppType = typeof app;
