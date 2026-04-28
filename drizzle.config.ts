import { config } from "dotenv";
import { resolve } from "path";
import type { Config } from "drizzle-kit";

config({ path: resolve(process.cwd(), ".env.local") });

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
