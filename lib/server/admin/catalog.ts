import "server-only";
import { and, count, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { AdminProduct, Department } from "@/lib/admin/model";
import { db, transaction } from "../db";
import { deals, departments, productReviews, products, vehicleModels } from "../schema";
import { AdminError, type ProductInput } from "./validate";

/** The next `position` in a drag-ordered table, so new rows go last. */
export const nextPosition = (table: PgTable, where = sql`true`) => sql`(SELECT COALESCE(MAX(position), -1) + 1 FROM ${table} WHERE ${where})`;

/** Sets `position` from the order of `ids`, in one transaction. Shared by every drag-ordered table. */
export async function reorder(table: PgTable, ids: string[]) {
  await transaction(async (tx) => {
    for (const [i, id] of ids.entries()) await tx.execute(sql`UPDATE ${table} SET position = ${i} WHERE id = ${id}`);
  });
}

// Departments -----------------------------------------------------------------------------------

const departmentColumns = {
  id: departments.id,
  parentId: departments.parentId,
  name: departments.name,
  slug: departments.slug,
  description: departments.description,
  image: departments.image,
  active: departments.active,
  createdAt: departments.createdAt,
};

export function listDepartments(): Promise<Department[]> {
  return db.select(departmentColumns).from(departments).orderBy(departments.position);
}

/** Creates or updates; new departments go last among their siblings. Sub-departments nest one level deep. */
export async function saveDepartment(d: Omit<Department, "createdAt">): Promise<Department> {
  if (d.parentId !== null) {
    if (d.parentId === d.id) throw new AdminError("A department can't sit under itself.");
    const [parent] = await db.select({ parentId: departments.parentId }).from(departments).where(eq(departments.id, d.parentId));
    if (!parent) throw new AdminError("That parent department doesn't exist.");
    if (parent.parentId !== null) throw new AdminError("Sub-departments can't have their own sub-departments.");
    if ((await db.select({ id: departments.id }).from(departments).where(eq(departments.parentId, d.id)).limit(1)).length) {
      throw new AdminError("This department has sub-departments, so it can't move under another one.");
    }
  }
  const [clash] = await db.select({ id: departments.id }).from(departments).where(and(eq(departments.slug, d.slug), ne(departments.id, d.id)));
  if (clash) throw new AdminError("Another department uses this URL slug.", 409);
  const { id, ...fields } = d;
  const [saved] = await db
    .insert(departments)
    .values({ id, ...fields, position: nextPosition(departments, d.parentId === null ? isNull(departments.parentId) : eq(departments.parentId, d.parentId)) })
    .onConflictDoUpdate({ target: departments.id, set: fields })
    .returning(departmentColumns);
  return saved;
}

/** Deletes the department and its sub-departments. Their products stay in the catalogue, unassigned. */
export async function deleteDepartment(id: string) {
  await transaction(async (tx) => {
    const children = await tx.select({ id: departments.id }).from(departments).where(eq(departments.parentId, id));
    const ids = [id, ...children.map((r) => r.id)];
    await tx.update(products).set({ departmentId: null }).where(inArray(products.departmentId, ids));
    await tx.delete(departments).where(eq(departments.parentId, id));
    const deleted = await tx.delete(departments).where(eq(departments.id, id)).returning({ id: departments.id });
    if (deleted.length === 0) throw new AdminError("Department not found.", 404);
  });
}

export async function reorderDepartments(ids: string[]) {
  await reorder(departments, ids);
  return listDepartments();
}

// Products --------------------------------------------------------------------------------------

const productColumns = {
  id: products.id,
  slug: products.slug,
  sku: products.sku,
  name: products.name,
  brand: products.brand,
  departmentId: products.departmentId,
  category: products.category,
  price: products.price,
  rrp: products.rrp,
  stock: products.stock,
  status: products.status,
  fits: products.fits,
  image: products.image,
  description: products.description,
  badge: products.badge,
  features: products.features,
  trendingRank: products.trendingRank,
  rating: products.rating,
  reviews: products.reviews,
  dealPrice: deals.dealPrice,
};

type ProductRow = Omit<AdminProduct, "departmentId" | "badge" | "trending"> & { departmentId: string | null; badge: string | null; trendingRank: number | null };

// Empty departmentId means unassigned (its department was deleted).
const toAdminProduct = ({ trendingRank, ...p }: ProductRow): AdminProduct => ({
  ...p,
  departmentId: p.departmentId ?? "",
  badge: p.badge ?? "",
  trending: trendingRank !== null,
});

const selectAdminProducts = () => db.select(productColumns).from(products).leftJoin(deals, eq(deals.productId, products.id));

/** Newest first, like the admin table. */
export async function listAdminProducts(): Promise<AdminProduct[]> {
  const rows = await selectAdminProducts().orderBy(desc(products.createdAt), desc(products.id));
  return rows.map(toAdminProduct);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || "product";
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [taken] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug));
    if (!taken) return slug;
  }
}

/**
 * Creates or updates a product with its deal and trending flag. A new product gets a URL slug from
 * its name; an existing one keeps its slug (so links don't break). Ratings come from reviews, never from here.
 */
export async function saveProduct(p: ProductInput): Promise<AdminProduct> {
  const [department] = await db.select({ id: departments.id }).from(departments).where(eq(departments.id, p.departmentId));
  if (!department) throw new AdminError("That department doesn't exist.");
  const [skuClash] = await db.select({ id: products.id }).from(products).where(and(eq(products.sku, p.sku), ne(products.id, p.id)));
  if (skuClash) throw new AdminError("Another product uses this SKU.", 409);
  if (p.fits !== "universal") {
    const [known] = await db.select({ n: count() }).from(vehicleModels).where(inArray(vehicleModels.id, p.fits));
    if (known.n !== p.fits.length) throw new AdminError("Some of the fitted vehicle models don't exist.");
  }

  const { id, dealPrice, trending, badge, ...fields } = p;
  // A new product's slug is picked before the transaction, which mustn't query outside itself (on Vercel the pool has one connection).
  const [current] = await db.select({ id: products.id }).from(products).where(eq(products.id, id));
  const slug = current ? null : await uniqueSlug(p.name);
  await transaction(async (tx) => {
    const [existing] = await tx.select({ trendingRank: products.trendingRank }).from(products).where(eq(products.id, id)).for("update");
    // Newly trending products go to the end of the trending list; already trending ones keep their place.
    const trendingRank = !trending ? null : (existing?.trendingRank ?? sql`(SELECT COALESCE(MAX(trending_rank), 0) + 1 FROM ${products})`);
    const values = { ...fields, badge: badge || null, trendingRank };
    if (existing) await tx.update(products).set(values).where(eq(products.id, id));
    else if (slug) await tx.insert(products).values({ id, ...values, slug, rating: 0, reviews: 0 });
    else throw new AdminError("Product not found.", 404); // Deleted while this save was running.

    if (dealPrice === null) await tx.delete(deals).where(eq(deals.productId, id));
    else await tx.insert(deals).values({ productId: id, dealPrice, claimed: 0 }).onConflictDoUpdate({ target: deals.productId, set: { dealPrice } });
  });
  const [saved] = await selectAdminProducts().where(eq(products.id, id));
  return toAdminProduct(saved);
}

/** Removes the product with its deal and reviews. Past orders keep their own copy of the name and price. */
export async function deleteProduct(id: string) {
  await transaction(async (tx) => {
    await tx.delete(deals).where(eq(deals.productId, id));
    await tx.delete(productReviews).where(eq(productReviews.productId, id));
    const deleted = await tx.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    if (deleted.length === 0) throw new AdminError("Product not found.", 404);
  });
}
