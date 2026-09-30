import "server-only";
import { CAR_BRANDS } from "../data";
import type { Category, Product } from "../types";
import { db } from "./db";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  rrp: number;
  rating: number;
  reviews: number;
  fits: string;
  badge: string | null;
  image: string;
  description: string;
  features: string;
  deal_price: number | null;
  claimed: number | null;
};

const SELECT = `
  SELECT p.*, d.deal_price, d.claimed
  FROM products p LEFT JOIN deals d ON d.product_id = p.id
`;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: row.price,
    rrp: row.rrp,
    rating: row.rating,
    reviews: row.reviews,
    fits: JSON.parse(row.fits),
    badge: row.badge ?? undefined,
    image: row.image,
    description: row.description,
    features: JSON.parse(row.features),
    deal: row.deal_price === null ? undefined : { price: row.deal_price, claimed: row.claimed ?? 0 },
  };
}

const all = (sql: string, ...params: (string | number | null)[]) =>
  (db.prepare(sql).all(...params) as unknown as ProductRow[]).map(toProduct);

export const SORTS = {
  popular: { label: "Most popular", sql: "p.reviews DESC" },
  rating: { label: "Top rated", sql: "p.rating DESC, p.reviews DESC" },
  "price-asc": { label: "Price: low to high", sql: "COALESCE(d.deal_price, p.price) ASC" },
  "price-desc": { label: "Price: high to low", sql: "COALESCE(d.deal_price, p.price) DESC" },
} as const;

export type SortKey = keyof typeof SORTS;

export type ProductFilters = {
  q?: string;
  category?: Category;
  model?: string;
  maxPrice?: number;
  onSale?: boolean;
  sort?: SortKey;
  ids?: string[];
  limit?: number;
};

export function listProducts(filters: ProductFilters = {}): Product[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  // Every word must match something, so "hilux stereo" means stereos that fit a HiLux.
  // A word naming a make or model matches by fitment; other words match name, brand or category.
  for (const word of searchWords(filters.q)) {
    // Prefix match only, so "sub" doesn't count as Mitsubishi.
    const models = CAR_BRANDS.flatMap((b) =>
      b.name.toLowerCase().startsWith(word) ? b.models : b.models.filter((m) => m.name.toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(word)),
    );
    const like = `%${word}%`;
    if (models.length > 0) {
      const ids = models.map(() => "?").join(",");
      where.push(`(p.fits = '"universal"' OR EXISTS (SELECT 1 FROM json_each(p.fits) WHERE value IN (${ids})))`);
      params.push(...models.map((m) => m.id));
    } else {
      where.push("(p.name LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)");
      params.push(like, like, like);
    }
  }
  if (filters.category) {
    where.push("p.category = ?");
    params.push(filters.category);
  }
  if (filters.model) {
    // fits is a JSON array of model ids or the string "universal".
    where.push(`(p.fits = '"universal"' OR EXISTS (SELECT 1 FROM json_each(p.fits) WHERE value = ?))`);
    params.push(filters.model);
  }
  if (filters.maxPrice) {
    where.push("COALESCE(d.deal_price, p.price) <= ?");
    params.push(filters.maxPrice);
  }
  if (filters.onSale) where.push("d.deal_price IS NOT NULL");
  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    where.push(`p.id IN (${filters.ids.map(() => "?").join(",")})`);
    params.push(...filters.ids);
  }

  const order = SORTS[filters.sort ?? "popular"].sql;
  const limit = filters.limit ? ` LIMIT ${Math.floor(filters.limit)}` : "";
  return all(`${SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order}${limit}`, ...params);
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

export function getProductBySlug(slug: string): Product | null {
  return all(`${SELECT} WHERE p.slug = ?`, slug)[0] ?? null;
}

export function getTrending(): Product[] {
  return all(`${SELECT} WHERE p.trending_rank IS NOT NULL ORDER BY p.trending_rank`);
}

export function getDeals(): Product[] {
  return all(`${SELECT} WHERE d.deal_price IS NOT NULL ORDER BY d.claimed DESC`);
}

export function getRelated(product: Product, limit = 4): Product[] {
  return all(`${SELECT} WHERE p.id != ? ORDER BY (p.category = ?) DESC, p.reviews DESC LIMIT ?`, product.id, product.category, limit);
}

export function getCategoryCounts(): Partial<Record<Category, number>> {
  const rows = db.prepare("SELECT category, COUNT(*) AS n FROM products GROUP BY category").all() as { category: Category; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}
