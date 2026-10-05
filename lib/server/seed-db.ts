import "server-only";
import { sql } from "drizzle-orm";
import type { DB } from "./db";
import { coupons, deals, departments, offers, orderItems, orders, products, vehicleMakes, vehicleModels, vehicleSubmodels } from "./schema";
import { SEED_DEALS, SEED_INVENTORY, SEED_PRODUCTS, SEED_TRENDING } from "./seed";
import { SEED_COUPONS, SEED_DEPARTMENTS, SEED_OFFERS, SEED_ORDERS, SEED_VEHICLE_MAKES } from "./seed-admin";

const iso = (at: string) => new Date(at).toISOString();

/** Writes the starting data. Runs once, inside the migration transaction, when the tables are first created. */
export function seed(db: DB) {
  const now = new Date().toISOString();

  // Upsert, so a database from before the admin panel keeps its products and gains their inventory fields.
  for (const p of SEED_PRODUCTS) {
    const rank = SEED_TRENDING.indexOf(p.id);
    const [sku, departmentId, stock, status] = SEED_INVENTORY[p.id] ?? [p.id.toUpperCase(), null, 0, "active"];
    const inventory = { sku, departmentId, stock, status, createdAt: now };
    db.insert(products)
      .values({ ...p, badge: p.badge ?? null, trendingRank: rank === -1 ? null : rank, ...inventory })
      .onConflictDoUpdate({ target: products.id, set: inventory })
      .run();
  }
  for (const d of SEED_DEALS) {
    const deal = { dealPrice: d.dealPrice, claimed: d.claimed };
    db.insert(deals).values({ productId: d.productId, ...deal }).onConflictDoUpdate({ target: deals.productId, set: deal }).run();
  }

  db.insert(departments)
    .values(SEED_DEPARTMENTS.map((d, i) => ({ ...d, position: i, createdAt: iso(d.createdAt) })))
    .run();

  SEED_VEHICLE_MAKES.forEach((make, i) => {
    db.insert(vehicleMakes)
      .values({ id: make.id, name: make.name, description: make.description, country: make.country, position: i, createdAt: iso(make.createdAt) })
      .run();
    make.models.forEach((model, j) => {
      db.insert(vehicleModels)
        .values({ id: model.id, makeId: make.id, name: model.name, description: model.description, position: j, createdAt: iso(model.createdAt) })
        .run();
      if (model.subModels.length) {
        db.insert(vehicleSubmodels)
          .values(model.subModels.map((s, k) => ({ ...s, modelId: model.id, position: k, createdAt: iso(s.createdAt) })))
          .run();
      }
    });
  });

  db.insert(coupons)
    .values(SEED_COUPONS.map((c) => ({ ...c, createdAt: iso(c.createdAt) })))
    .run();
  db.insert(offers)
    .values(SEED_OFFERS.map((o, i) => ({ ...o, position: i, createdAt: iso(o.createdAt) })))
    .run();

  // Sample orders so the dashboard isn't empty in development. Never written to a production database.
  const hasOrders = db.select({ one: sql`1` }).from(orders).limit(1).get();
  if (process.env.NODE_ENV === "production" || hasOrders) return;
  // Oldest first, so rowid order (and the CB- numbers) match the dates.
  for (const o of [...SEED_ORDERS].reverse()) {
    const subtotal = o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    db.insert(orders)
      .values({
        id: o.id,
        createdAt: iso(o.createdAt),
        status: o.status,
        email: o.customer.email,
        name: o.customer.name,
        phone: o.customer.phone,
        ...o.shipTo,
        delivery: o.delivery,
        coupon: o.coupon ?? null,
        subtotal,
        discount: o.discount,
        shipping: o.shipping,
        total: subtotal - o.discount + o.shipping,
      })
      .run();
    db.insert(orderItems)
      .values(o.items.map((i) => ({ orderId: o.id, ...i })))
      .run();
  }
}
