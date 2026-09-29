import "server-only";
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

  if (filters.q) {
    where.push("(p.name LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)");
    const like = `%${filters.q}%`;
    params.push(like, like, like);
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
