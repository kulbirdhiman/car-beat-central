import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Product } from "../types";
import { getFitCounts, listProducts, type ProductFilters } from "./queries";

// Public browsing only. Cart quotes and order creation continue querying live
// prices and stock through queries.ts. Admin writes invalidate this shared tag.
const options = { revalidate: 60, tags: ["store-home-data"] };
// Home/shop warm this snapshot before a shopper opens a product. Reuse it for
// detail pages instead of starting separate product, related and add-on queries.
export const getBrowseCatalog = cache(unstable_cache(() => listProducts(), ["browse-catalog-v1"], options));
const getFilteredProducts = unstable_cache(listProducts, ["browse-products-v1"], options);
export async function getBrowseProducts(filters: ProductFilters = {}) {
  if (Object.values(filters).every((value) => value === undefined)) return getBrowseCatalog();
  const [products] = await Promise.all([getFilteredProducts(filters), getBrowseCatalog()]);
  return products;
}
export const getBrowseProduct = cache(async (slug: string) => (await getBrowseCatalog()).find((product) => product.slug === slug) ?? null);
export async function getBrowseRelated(product: Product) {
  return (await getBrowseCatalog()).filter((candidate) => candidate.id !== product.id).sort((a, b) =>
    Number(b.departmentId === product.departmentId) - Number(a.departmentId === product.departmentId)
    || Number(b.category === product.category) - Number(a.category === product.category)
    || b.reviews - a.reviews,
  ).slice(0, 4);
}
export async function getBrowseAddOns(product: Product) {
  const byId = new Map((await getBrowseCatalog()).map((candidate) => [candidate.id, candidate]));
  return product.addOnIds.flatMap((id) => byId.get(id) ?? []);
}

const cachedFitCounts = unstable_cache(getFitCounts, ["browse-fit-counts-v1"], options);
export function getBrowseFitCounts(filters: ProductFilters) {
  // Counts describe all vehicles matching the other filters; sort and the
  // currently selected vehicle do not affect them or their cache key.
  return cachedFitCounts({ q: filters.q, category: filters.category, dept: filters.dept, maxPrice: filters.maxPrice, year: filters.year, ids: filters.ids });
}
