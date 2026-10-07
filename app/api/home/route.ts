import { listCoupons } from "@/lib/server/admin/promos";
import { getCarBrands, getDeals, getFitCounts, getLiveOffers, getStoreDepartments, getTrending, listProducts } from "@/lib/server/queries";

/**
 * GET /api/home
 * Everything the home page reads from the database, in one response, for inspecting the live data.
 */
export async function GET() {
  const [products, offers, departments, byRating, trending, deals, coupons, carBrands, fitCounts] = await Promise.all([
    listProducts(),
    getLiveOffers(),
    getStoreDepartments(),
    listProducts({ sort: "rating", limit: 10 }),
    getTrending(),
    getDeals(),
    listCoupons(),
    getCarBrands(),
    getFitCounts(),
  ]);
  const reviews = products.reduce((n, p) => n + p.reviews, 0);
  const offerCodes = new Set(offers.map((o) => o.code));

  return Response.json({
    stats: {
      rating: products.reduce((n, p) => n + p.rating * p.reviews, 0) / Math.max(reviews, 1),
      reviews,
      products: products.length,
    },
    departments,
    products,
    bestSellers: byRating,
    trending,
    deals,
    offers,
    coupons: coupons.filter((c) => offerCodes.has(c.code)),
    carBrands,
    fitCounts,
  });
}
