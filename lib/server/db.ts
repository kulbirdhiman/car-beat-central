import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Supabase Postgres. Use the session pooler (port 5432), which is reachable over IPv4 from Vercel.
 * Supabase connection strings are sometimes configured with the transaction pooler (6543); that mode can hang
 * when storefront requests issue concurrent queries, so normalize it here. Prepared statements stay off.
 * Migrations aren't run here: apply them with `npm run db:migrate`.
 */
function open() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. Add your Supabase connection string to .env.");
  const url = new URL(connectionString);
  if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543") url.port = "5432";
  // Supabase's session pooler has a small project-wide connection limit (often 15).
  // Keep local/dev instances small too, so one app process cannot consume most of it.
  const client = postgres(url.toString(), { prepare: false, max: process.env.VERCEL ? 1 : 2, connect_timeout: 8 });
  return drizzle(client, { schema });
}

export type DB = PostgresJsDatabase<typeof schema>;

// Defer opening the connection until a query runs. Next.js loads route modules
// while collecting build metadata, and DATABASE_URL is only needed at runtime.
const globalForDb = globalThis as unknown as { carbeatDb?: DB };
function getDb(): DB {
  if (!globalForDb.carbeatDb) globalForDb.carbeatDb = open();
  return globalForDb.carbeatDb;
}

export const db = new Proxy({} as DB, {
  get(_target, property) {
    const instance = getDb();
    const value = Reflect.get(instance, property, instance) as unknown;
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/** Runs `run` in a transaction, rolling back if it throws. */
export function transaction<T>(run: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(run);
}
