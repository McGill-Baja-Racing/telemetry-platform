import { hc } from "hono/client";
import type { AppType } from "server";

/** Typed API client: the routes and their response types come from the server code. */
export const client = hc<AppType>("/");
