import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 数据库直连客户端（仅用于 Drizzle Kit 迁移，应用层通过 Supabase Client 操作数据库）
// Supabase provides two connection modes:
// - Transaction mode (port 6543): for serverless functions
// - Session mode (port 5432): for migrations and direct connections

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL 未配置。应用通过 Supabase Client 操作数据库，" +
    "Drizzle 直连客户端仅用于本地迁移（drizzle-kit）。"
  );
}

const client = postgres(connectionString, {
  prepare: false,         // Required for Supabase transaction mode
  ssl: "require",
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });
