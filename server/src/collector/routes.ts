import { Hono } from "hono";
import { status } from "./collector.ts";

export const collectorRoutes = new Hono().get("/", (c) => c.json(status));
