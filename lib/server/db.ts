import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Supabase Postgres. DATABASE_URL is the project's transaction pooler connection string (port 6543),
 * which suits serverless hosts. The pooler doesn't support prepared statements, so they're turned off.
 * Migrations aren't run here: apply them with `npm run db:migrate`.
 */
function open() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add your Supabase connection string to .env.");
  const client = postgres(url, { prepare: false, max: process.env.VERCEL ? 1 : 10 });
  return drizzle(client, { schema });
}

export type DB = PostgresJsDatabase<typeof schema>;

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { carbeatDb?: DB };
export const db = globalForDb.carbeatDb ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.carbeatDb = db;

export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/** Runs `run` in a transaction, rolling back if it throws. */
export function transaction<T>(run: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(run);
}
