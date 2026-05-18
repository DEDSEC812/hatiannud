import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// Enable SSL automatically for hosted Postgres (Supabase, Neon, Render, Railway, RDS, etc.).
// Local dev databases (localhost / 127.0.0.1) keep SSL disabled.
const isLocal = /@(localhost|127\.0\.0\.1)[:\/]/.test(connectionString);
const sslDisabled = process.env.PGSSL === "disable";
const ssl = isLocal || sslDisabled ? false : { rejectUnauthorized: false };

export const pool = new Pool({ connectionString, ssl });
export const db = drizzle(pool, { schema });

export * from "./schema";
