import { listCoupons } from "@/lib/server/admin/promos";
import { getCarBrands, getDeals, getFitCounts, getLiveOffers, getStoreDepartments, getTrending, listProducts } from "@/lib/server/queries";

/**
 * GET /api/home
 * Everything the home page reads from the database, in one response, for inspecting the live data.
 */
export async function GET() {
  const products = listProducts();
  const reviews = products.reduce((n, p) => n + p.reviews, 0);
  const offers = getLiveOffers();
  const offerCodes = new Set(offers.map((o) => o.code));

  return Response.json({
    stats: {
      rating: products.reduce((n, p) => n + p.rating * p.reviews, 0) / Math.max(reviews, 1),
      reviews,
      products: products.length,
    },
    departments: getStoreDepartments(),
    products,
    bestSellers: listProducts({ sort: "rating" }).slice(0, 10),
    trending: getTrending(),
    deals: getDeals(),
    offers,
    coupons: listCoupons().filter((c) => offerCodes.has(c.code)),
    carBrands: getCarBrands(),
    fitCounts: getFitCounts(),
  });
}
