import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SEED_DEALS, SEED_PRODUCTS, SEED_TRENDING } from "./seed";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "carbeat.db");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    rrp INTEGER NOT NULL,
    rating REAL NOT NULL,
    reviews INTEGER NOT NULL,
    fits TEXT NOT NULL,          -- JSON array of model ids, or "universal"
    badge TEXT,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT NOT NULL,      -- JSON array
    trending_rank INTEGER
  );
  CREATE TABLE IF NOT EXISTS deals (
    product_id TEXT PRIMARY KEY REFERENCES products(id),
    deal_price INTEGER NOT NULL,
    claimed INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    suburb TEXT NOT NULL,
    state TEXT NOT NULL,
    postcode TEXT NOT NULL,
    delivery TEXT NOT NULL,
    coupon TEXT,
    subtotal INTEGER NOT NULL,   -- all money in cents, GST inclusive
    discount INTEGER NOT NULL,
    shipping INTEGER NOT NULL,
    total INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS order_items (
    order_id TEXT NOT NULL REFERENCES orders(id),
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    qty INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    preferred_date TEXT NOT NULL,
    notes TEXT
  );
  CREATE TABLE IF NOT EXISTS subscribers (
    email TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

function open() {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  // Build workers open the file concurrently: wait on locks (set at open, so it covers the pragmas too).
  const db = new DatabaseSync(DB_PATH, { timeout: 15_000 });
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  syncCatalogue(db);
  return db;
}

/** The catalogue lives in code (seed.ts); keep the database in step with it. */
function syncCatalogue(db: DatabaseSync) {
  const upsert = db.prepare(`
    INSERT INTO products (id, slug, name, brand, category, price, rrp, rating, reviews, fits, badge, image, description, features, trending_rank)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug, name = excluded.name, brand = excluded.brand, category = excluded.category,
      price = excluded.price, rrp = excluded.rrp, rating = excluded.rating, reviews = excluded.reviews,
      fits = excluded.fits, badge = excluded.badge, image = excluded.image, description = excluded.description,
      features = excluded.features, trending_rank = excluded.trending_rank
  `);
  const upsertDeal = db.prepare(`
    INSERT INTO deals (product_id, deal_price, claimed) VALUES (?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET deal_price = excluded.deal_price, claimed = excluded.claimed
  `);

  db.exec("BEGIN IMMEDIATE");
  try {
    for (const p of SEED_PRODUCTS) {
      const rank = SEED_TRENDING.indexOf(p.id);
      upsert.run(
        p.id, p.slug, p.name, p.brand, p.category, p.price, p.rrp, p.rating, p.reviews,
        JSON.stringify(p.fits), p.badge ?? null, p.image, p.description, JSON.stringify(p.features),
        rank === -1 ? null : rank,
      );
    }
    db.exec("DELETE FROM deals");
    for (const d of SEED_DEALS) upsertDeal.run(d.productId, d.dealPrice, d.claimed);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { carbeatDb?: DatabaseSync };
export const db = globalForDb.carbeatDb ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.carbeatDb = db;
