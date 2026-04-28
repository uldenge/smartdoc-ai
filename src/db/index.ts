import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase provides two connection modes:
// - Transaction mode (port 6543): for serverless functions
// - Session mode (port 5432): for migrations and direct connections
// We use the Supabase pooler with transaction mode for app queries

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false,         // Required for Supabase transaction mode
  ssl: "require",
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });
