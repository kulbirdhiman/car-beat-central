import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Supabase Postgres. DATABASE_URL is the project's session pooler connection string (port 5432), which is reachable
 * over IPv4 (unlike the direct db.*.supabase.co host, so it works from Vercel). The transaction pooler (6543) is avoided:
 * it hangs when queries run concurrently, as Promise.all in the store layout does. Prepared statements stay off.
 * Migrations aren't run here: apply them with `npm run db:migrate`.
 */
function open() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add your Supabase connection string to .env.");
  const client = postgres(url, { prepare: false, max: process.env.VERCEL ? 1 : 10 });
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
