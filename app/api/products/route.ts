import { listProducts } from "@/lib/server/queries";
import { parseFilters } from "@/lib/server/validate";

/**
 * GET /api/products?q=&category=&dept=&model=&maxPrice=&sale=1&sort=&ids=a,b&limit=
 * Public catalogue search used by the search dialog and cart.
 */
export async function GET(request: Request) {
  const filters = parseFilters(new URL(request.url).searchParams);
  const products = listProducts(filters);
  return Response.json({ products, count: products.length });
}
