import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? "postgres://baja:baja@localhost:5432/telemetry_test",
    },
    globalSetup: "./src/db/test-database.ts",
  },
});
