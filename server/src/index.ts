import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { app } from "./app.ts";
import { env } from "./env.ts";

const server = new Hono()
  .route("/", app)
  .use(serveStatic({ root: "../web/dist" }))
  .get("*", serveStatic({ path: "../web/dist/index.html" }));

serve({ fetch: server.fetch, port: env.PORT }, (info) => {
  console.log(`Server on http://localhost:${info.port}`);
});
