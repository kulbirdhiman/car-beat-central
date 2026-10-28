import "server-only";
import { unstable_cache } from "next/cache";
import { listCoupons } from "@/lib/server/admin/promos";
import { productFitsModel } from "@/lib/data";
import type { Product } from "@/lib/types";
import { getCarBrands, getLiveOffers, getProductCount, getStoreDepartments, getTrending, listProducts } from "@/lib/server/queries";

/** Lightweight data needed by every storefront page's header and vehicle picker. */
export const getStoreChromeData = unstable_cache(
  async () => {
    const [departments, brands, total] = await Promise.all([getStoreDepartments(), getCarBrands(), getProductCount()]);
    return { departments, brands, total };
  },
  ["store-chrome-data-v2"],
  { revalidate: 60, tags: ["store-home-data"] },
);

/** Shared storefront data used by the home page and store chrome. */
export const getHomeData = unstable_cache(
  async () => {
    const [products, trending, offers, coupons, chrome] = await Promise.all([
      listProducts(),
      getTrending(),
      getLiveOffers(),
      listCoupons(),
      getStoreChromeData(),
    ]);
    const { departments, brands } = chrome;
    const byRating = [...products].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    const fitCounts = Object.fromEntries(brands.flatMap((brand) => brand.models.flatMap((model) => [
      [model.id, products.filter((product) => productFitsModel(product, model.id)).length] as const,
      ...(model.subModels ?? []).map((sub) => [sub.id, products.filter((product) => productFitsModel(product, model.id, sub.id)).length] as const),
    ])));

    return {
      products,
      departments,
      trending,
      byRating,
      offers,
      coupons,
      brands,
      fitCounts,
      deals: products.filter((product) => product.deal),
    };
  },
  ["store-home-data-v1"],
  { revalidate: 60, tags: ["store-home-data"] },
);

export function productPrice(product: Product) {
  return product.deal?.price ?? product.price;
}
