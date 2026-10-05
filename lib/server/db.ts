import "server-only";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { readMigrationFiles, type MigrationMeta } from "drizzle-orm/migrator";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as schema from "./schema";
import { seed } from "./seed-db";

// Serverless hosts (Vercel) only allow writes under the temp dir. The database is seeded when it's
// created, so the catalogue is always there; admin edits and orders written there don't survive a cold start.
const DB_PATH =
  process.env.DATABASE_PATH ?? (process.env.VERCEL ? path.join(tmpdir(), "carbeat.db") : path.join(process.cwd(), "data", "carbeat.db"));

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

export type DB = BetterSQLite3Database<typeof schema>;

function open(): DB {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  // Build workers open the file concurrently, so wait on locks rather than failing.
  const sqlite = new Database(DB_PATH, { timeout: 15_000 });
  // Switching a brand-new file to WAL can fail with "locked" without waiting, so retry briefly.
  withRetry(() => sqlite.pragma("journal_mode = WAL"));
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("synchronous = NORMAL");
  const db = drizzle(sqlite, { schema });
  migrate(sqlite, db);
  return db;
}

/**
 * Applies pending drizzle-kit migrations, recorded in Drizzle's own __drizzle_migrations table
 * (so `drizzle-kit migrate` agrees with it). Unlike Drizzle's built-in migrator, this takes the
 * write lock first: concurrent build workers then queue up and only the first one does the work.
 */
function migrate(sqlite: Database.Database, db: DB) {
  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  sqlite.exec("CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT NOT NULL, created_at NUMERIC)");
  const lastApplied = () => (sqlite.prepare("SELECT MAX(created_at) AS at FROM __drizzle_migrations").get() as { at: number | null }).at;
  const pending = (after: number | null) => migrations.filter((m) => after === null || m.folderMillis > Number(after));
  if (pending(lastApplied()).length === 0) return;

  sqlite
    .transaction(() => {
      const after = lastApplied();
      const record = (m: MigrationMeta) => sqlite.prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)").run(m.hash, m.folderMillis);
      let needsSeed = false;
      let todo = pending(after);

      if (after === null) {
        const legacy = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'products'").get();
        if (legacy) {
          // Created before Drizzle: bring it up to the first migration's schema by hand, keeping its data.
          needsSeed = upgradeLegacy(sqlite);
          record(migrations[0]);
          todo = todo.slice(1);
        } else {
          needsSeed = true;
        }
      }
      for (const m of todo) {
        for (const statement of m.sql) if (statement.trim()) sqlite.exec(statement);
        record(m);
      }
      if (needsSeed) seed(db);
    })
    .immediate();
}

/**
 * Upgrades a database made by the pre-Drizzle code to match drizzle/0000_init.sql.
 * PRAGMA user_version was 0 for the original storefront schema and 2 once the admin tables were added.
 * Returns true when the admin tables were just created and need seeding.
 */
function upgradeLegacy(sqlite: Database.Database): boolean {
  const version = sqlite.pragma("user_version", { simple: true }) as number;
  if (version >= 2) return false;
  sqlite.exec(`
    ALTER TABLE products ADD COLUMN sku TEXT NOT NULL DEFAULT '';
    ALTER TABLE products ADD COLUMN department_id TEXT;
    ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE products ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    ALTER TABLE products ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
    CREATE INDEX products_status_category ON products(status, category);
    CREATE TABLE departments (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, image TEXT NOT NULL,
      active INTEGER NOT NULL, position INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE vehicle_makes (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, country TEXT NOT NULL, position INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE vehicle_models (
      id TEXT PRIMARY KEY, make_id TEXT NOT NULL REFERENCES vehicle_makes(id) ON DELETE CASCADE, name TEXT NOT NULL,
      description TEXT NOT NULL, position INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX vehicle_models_make ON vehicle_models(make_id, position);
    CREATE TABLE vehicle_submodels (
      id TEXT PRIMARY KEY, model_id TEXT NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE, name TEXT NOT NULL,
      description TEXT NOT NULL, years TEXT NOT NULL, position INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX vehicle_submodels_model ON vehicle_submodels(model_id, position);
    CREATE TABLE coupons (
      id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, type TEXT NOT NULL, value INTEGER NOT NULL,
      buy_qty INTEGER NOT NULL, get_qty INTEGER NOT NULL, min_order INTEGER NOT NULL, max_discount INTEGER, scope TEXT NOT NULL,
      product_ids TEXT NOT NULL, department_ids TEXT NOT NULL, model_ids TEXT NOT NULL, first_order_only INTEGER NOT NULL,
      usage_limit INTEGER, used INTEGER NOT NULL DEFAULT 0, starts_at TEXT, ends_at TEXT, active INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE offers (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL, highlight TEXT NOT NULL, image TEXT NOT NULL, href TEXT NOT NULL,
      coupon_id TEXT REFERENCES coupons(id) ON DELETE SET NULL, starts_at TEXT, ends_at TEXT, active INTEGER NOT NULL,
      position INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX order_items_order ON order_items(order_id);
    CREATE INDEX orders_created ON orders(created_at);
    CREATE INDEX orders_email ON orders(email);
  `);
  // Old rows used SQLite's "YYYY-MM-DD HH:MM:SS"; make them ISO 8601 UTC like everything new.
  for (const table of ["orders", "bookings", "product_reviews", "subscribers"]) {
    sqlite.exec(`UPDATE ${table} SET created_at = replace(created_at, ' ', 'T') || '.000Z' WHERE created_at NOT LIKE '%T%'`);
  }
  return true;
}

function withRetry(run: () => void, attempts = 50) {
  for (let i = 1; ; i++) {
    try {
      return run();
    } catch (error) {
      if (i >= attempts || (error as { code?: string }).code !== "SQLITE_BUSY") throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { carbeatDb?: DB };
export const db = globalForDb.carbeatDb ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.carbeatDb = db;

export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/** Runs `run` in a write transaction (taking the lock up front), rolling back if it throws. */
export function transaction<T>(run: (tx: Tx) => T): T {
  return db.transaction(run, { behavior: "immediate" });
}
