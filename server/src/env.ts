import { existsSync } from "node:fs";
import { z } from "zod";

if (existsSync(".env")) process.loadEnvFile();

export const env = z
  .object({
    DATABASE_URL: z.string(),
    PORT: z.coerce.number().default(3000),
  })
  .parse(process.env);
