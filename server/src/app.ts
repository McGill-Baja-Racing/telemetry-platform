import { Hono } from "hono";
import { collectorRoutes } from "./collector/routes.ts";
import { recordingRoutes } from "./recordings/routes.ts";

/** Keep the calls chained: `AppType` carries the route types to the frontend. */
export const app = new Hono()
  .basePath("/api")
  .get("/health", (c) => c.json({ ok: true }))
  .route("/collector", collectorRoutes)
  .route("/recordings", recordingRoutes);

export type AppType = typeof app;
