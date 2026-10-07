import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { productFitsModel } from "../data";
import type { CarBrand, Category, Offer, Product, StoreDepartment } from "../types";
import { db } from "./db";
import { coupons, deals, departments, offers, products, vehicleMakes, vehicleModels } from "./schema";

const price = sql<number>`COALESCE(${deals.dealPrice}, ${products.price})`;
// Draft products are hidden from the store everywhere.
const isActive = eq(products.status, "active");

/** Products with their deal, if any, and their department's parent (for sub-departments). */
const selectProducts = () =>
  db
    .select({
      product: products,
      dealPrice: deals.dealPrice,
      claimed: deals.claimed,
      departmentName: departments.name,
      departmentParentId: departments.parentId,
    })
    .from(products)
    .leftJoin(deals, eq(deals.productId, products.id))
    .leftJoin(departments, eq(departments.id, products.departmentId));

type ProductRow = {
  product: typeof products.$inferSelect;
  dealPrice: number | null;
  claimed: number | null;
  departmentName: string | null;
  departmentParentId: string | null;
};

function toProduct({ product: p, dealPrice, claimed, departmentName, departmentParentId }: ProductRow): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    rrp: p.rrp,
    rating: p.rating,
    reviews: p.reviews,
    fits: p.fits,
    badge: p.badge ?? undefined,
    image: p.image,
    description: p.description,
    features: p.features,
    departmentId: p.departmentId,
    departmentName,
    departmentParentId,
    stock: p.stock,
    deal: dealPrice === null ? undefined : { price: dealPrice, claimed: claimed ?? 0 },
  };
}

/** Products that are universal or fit any of these model ids. `fits` is a JSON array, or the JSON string "universal". */
function fitsAny(modelIds: string[]): SQL {
  return sql`(${products.fits} = '"universal"'::jsonb OR ${products.fits} ?| ARRAY[${sql.join(
    modelIds.map((id) => sql`${id}`),
    sql`, `,
  )}]::text[])`;
}

export const SORTS = {
  popular: { label: "Most popular", order: () => [desc(products.reviews)] },
  rating: { label: "Top rated", order: () => [desc(products.rating), desc(products.reviews)] },
  "price-asc": { label: "Price: low to high", order: () => [asc(price)] },
  "price-desc": { label: "Price: high to low", order: () => [desc(price)] },
} as const;

export type SortKey = keyof typeof SORTS;

export type ProductFilters = {
  q?: string;
  category?: Category;
  /** Department slug; a top-level department includes its sub-departments' products. */
  dept?: string;
  model?: string;
  maxPrice?: number;
  onSale?: boolean;
  sort?: SortKey;
  ids?: string[];
  limit?: number;
};

export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const where: (SQL | undefined)[] = [isActive];

  // Every word must match something, so "hilux stereo" means stereos that fit a HiLux.
  // A word naming a make or model matches by fitment; other words match name, brand or category.
  const words = searchWords(filters.q);
  const brands = words.length ? await getCarBrands() : [];
  for (const word of words) {
    // Prefix match only, so "sub" doesn't count as Mitsubishi.
    const models = brands.flatMap((b) =>
      b.name.toLowerCase().startsWith(word) ? b.models : b.models.filter((m) => m.name.toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(word)),
    );
    const pattern = `%${word}%`;
    where.push(
      models.length > 0
        ? fitsAny(models.map((m) => m.id))
        : or(ilike(products.name, pattern), ilike(products.brand, pattern), ilike(products.category, pattern), ilike(departments.name, pattern)),
    );
  }
  if (filters.category) where.push(eq(products.category, filters.category));
  if (filters.dept) {
    const dept = db.select({ id: departments.id }).from(departments).where(eq(departments.slug, filters.dept));
    where.push(
      inArray(
        products.departmentId,
        db.select({ id: departments.id }).from(departments).where(or(eq(departments.slug, filters.dept), inArray(departments.parentId, dept))),
      ),
    );
  }
  if (filters.model) where.push(fitsAny([filters.model]));
  if (filters.maxPrice) where.push(lte(price, filters.maxPrice));
  if (filters.onSale) where.push(isNotNull(deals.dealPrice));
  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    where.push(inArray(products.id, filters.ids));
  }

  const query = selectProducts()
    .where(and(...where))
    .orderBy(...SORTS[filters.sort ?? "popular"].order());
  const rows = await (filters.limit ? query.limit(Math.floor(filters.limit)) : query);
  return rows.map(toProduct);
}

/** Lower-cased search words with simple plural stripping ("stereos" -> "stereo", "dash cams" -> "dash", "cam"). */
function searchWords(q: string | undefined): string[] {
  if (!q) return [];
  return q
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 1)
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .slice(0, 6);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const [row] = await selectProducts()
    .where(and(isActive, eq(products.slug, slug)))
    .limit(1);
  return row ? toProduct(row) : null;
}

export async function getTrending(): Promise<Product[]> {
  const rows = await selectProducts().where(and(isActive, isNotNull(products.trendingRank))).orderBy(products.trendingRank);
  return rows.map(toProduct);
}

export async function getDeals(): Promise<Product[]> {
  const rows = await selectProducts().where(and(isActive, isNotNull(deals.dealPrice))).orderBy(desc(deals.claimed));
  return rows.map(toProduct);
}

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  const rows = await selectProducts()
    .where(and(isActive, ne(products.id, product.id)))
    .orderBy(
      sql`(${products.departmentId} IS NOT DISTINCT FROM ${product.departmentId}::text) DESC`,
      sql`(${products.category} = ${product.category}) DESC`,
      desc(products.reviews),
    )
    .limit(limit);
  return rows.map(toProduct);
}

export async function getProductCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(products).where(isActive);
  return row?.n ?? 0;
}

/**
 * Active departments that have active products, in admin order, as the store's category navigation.
 * Sub-departments are listed under their parent and counted in its total; a hidden parent hides them too.
 */
export async function getStoreDepartments(): Promise<StoreDepartment[]> {
  const countRows = await db
    .select({ id: products.departmentId, n: count() })
    .from(products)
    .where(and(isActive, isNotNull(products.departmentId)))
    .groupBy(products.departmentId);
  const counts = new Map(countRows.map((r) => [r.id, r.n]));
  const rows = await db
    .select({ id: departments.id, parentId: departments.parentId, slug: departments.slug, name: departments.name, image: departments.image })
    .from(departments)
    .where(eq(departments.active, true))
    .orderBy(departments.position);
  return rows
    .filter((d) => d.parentId === null)
    .map((d) => {
      const children = rows
        .filter((c) => c.parentId === d.id && counts.get(c.id))
        .map((c) => ({ id: c.id, slug: c.slug, name: c.name, image: c.image, count: counts.get(c.id)!, children: [] }));
      const count = (counts.get(d.id) ?? 0) + children.reduce((n, c) => n + c.count, 0);
      return { id: d.id, slug: d.slug, name: d.name, image: d.image, count, children };
    })
    .filter((d) => d.count > 0);
}

/** Products that fit each model id, for the vehicle pickers' "Show N matching parts". */
export async function getFitCounts(): Promise<Record<string, number>> {
  const [all, brands] = await Promise.all([listProducts(), getCarBrands()]);
  return Object.fromEntries(brands.flatMap((b) => b.models).map((m) => [m.id, all.filter((p) => productFitsModel(p, m.id)).length]));
}

/** Makes and their models in admin order, for the store's vehicle pickers. Makes with no models are left out. */
export async function getCarBrands(): Promise<CarBrand[]> {
  const rows = await db
    .select({ makeId: vehicleMakes.id, makeName: vehicleMakes.name, id: vehicleModels.id, name: vehicleModels.name })
    .from(vehicleMakes)
    .innerJoin(vehicleModels, eq(vehicleModels.makeId, vehicleMakes.id))
    .orderBy(vehicleMakes.position, vehicleModels.position);
  const brands: CarBrand[] = [];
  for (const r of rows) {
    if (brands.at(-1)?.id !== r.makeId) brands.push({ id: r.makeId, name: r.makeName, models: [] });
    brands.at(-1)!.models.push({ id: r.id, name: r.name });
  }
  return brands;
}

/** Offers that are switched on and within their dates, with their coupon code if that code is usable too. */
export async function getLiveOffers(): Promise<Offer[]> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  const live = (t: { active: AnyPgColumn; startsAt: AnyPgColumn; endsAt: AnyPgColumn }) =>
    and(eq(t.active, true), sql`(${t.startsAt} IS NULL OR ${t.startsAt} <= ${today})`, sql`(${t.endsAt} IS NULL OR ${t.endsAt} >= ${today})`);
  return db
    .select({ id: offers.id, title: offers.title, subtitle: offers.subtitle, highlight: offers.highlight, image: offers.image, href: offers.href, code: coupons.code })
    .from(offers)
    .leftJoin(coupons, and(eq(coupons.id, offers.couponId), live(coupons), sql`(${coupons.usageLimit} IS NULL OR ${coupons.used} < ${coupons.usageLimit})`))
    .where(live(offers))
    .orderBy(offers.position);
}
