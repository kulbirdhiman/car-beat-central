import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CategoryRail, type RailGroup } from "@/components/home/CategoryRail";
import { TodayDeals } from "@/components/home/deals/TodayDeals";
import { Faq } from "@/components/home/Faq";
import { GarageSection } from "@/components/home/GarageSection";
import { Hero } from "@/components/home/hero/Hero";
import { InstallerSection } from "@/components/home/InstallerSection";
import { InstallGallery } from "@/components/home/InstallGallery";
import { Offers } from "@/components/home/offers/Offers";
import { TrustBar } from "@/components/home/TrustBar";
import { UpgradeSpotlight } from "@/components/home/UpgradeSpotlight";
import { listCoupons } from "@/lib/server/admin/promos";
import { SLIDE_SOURCES, type Slide } from "@/components/home/hero/slides";
import { discountPercent, findDepartment, formatPrice } from "@/lib/data";
import { getCarBrands, getFitCounts, getLiveOffers, getStoreDepartments, getTrending, listProducts } from "@/lib/server/queries";
import type { Product, StoreDepartment } from "@/lib/types";

export default async function Home() {
  const [products, departments, trending, byRating, offers, coupons, fitCounts] = await Promise.all([
    listProducts(),
    getStoreDepartments(),
    getTrending(),
    listProducts({ sort: "rating" }),
    getLiveOffers(),
    listCoupons(),
    getFitCounts(),
  ]);
  const reviews = products.reduce((n, p) => n + p.reviews, 0);
  const stats = {
    // Review-weighted, so a 5-star product with 3 reviews doesn't skew it.
    rating: products.reduce((n, p) => n + p.rating * p.reviews, 0) / Math.max(reviews, 1),
    reviews,
  };
  // The most trending product, or the top rated when nothing is marked trending.
  const spotlight = trending[0] ?? byRating[0];
  const groups: RailGroup[] = [
    { key: "all", label: "All best sellers", href: "/shop?sort=rating", products: byRating.slice(0, 10) },
    ...departments.map((d) => ({
      key: d.id,
      label: d.name,
      href: `/shop?dept=${d.slug}&sort=rating`,
      products: byRating.filter((p) => p.departmentId === d.id || p.departmentParentId === d.id).slice(0, 10),
    })),
  ].filter((g) => g.products.length > 0);
  const offerCodes = new Set(offers.map((o) => o.code));
  const codes = coupons.filter((c) => offerCodes.has(c.code));

  return (
    <>
      {/* Deals lead: banners and today's price drops, then browsing by category, product and car. */}
      <Hero slides={await buildSlides(departments)} promo={offers[0]} fitCounts={fitCounts} />
      <TrustBar />
      <TodayDeals />
      <CategoryGrid departments={departments} />
      {spotlight && <UpgradeSpotlight product={spotlight} />}
      <CategoryRail groups={groups} />
      <GarageSection products={products} />
      <Offers offers={offers} />
      <InstallerSection />
      <InstallGallery products={products} />
      <Faq stats={stats} codes={codes} />
    </>
  );
}

const priceOf = (p: Product) => p.deal?.price ?? p.price;

/** Banners whose department or vehicle has products, priced from those products. Always at least one. */
async function buildSlides(departments: StoreDepartment[]): Promise<Slide[]> {
  const models = (await getCarBrands()).flatMap((b) => b.models);
  const built = await Promise.all(SLIDE_SOURCES.map(async ({ target, ...copy }): Promise<Slide[]> => {
    if ("dept" in target) {
      const dept = findDepartment(departments, (d) => d.slug === target.dept)?.department;
      const products = dept ? await listProducts({ dept: dept.slug }) : [];
      if (!dept || products.length === 0) return [];
      const from = Math.min(...products.map(priceOf));
      return [{ ...copy, price: `From ${formatPrice(from)}`, cta: { label: `Shop ${dept.name.toLowerCase()}`, href: `/shop?dept=${dept.slug}` } }];
    }
    if (!models.some((m) => m.id === target.model)) return [];
    const products = await listProducts({ model: target.model });
    if (products.length === 0) return [];
    const best = Math.max(...products.map((p) => discountPercent(priceOf(p), p.rrp)));
    return [{ ...copy, price: best > 0 ? `Save up to ${best}%` : `${products.length} parts that fit`, cta: { label: target.label, href: `/shop?model=${target.model}` } }];
  }));
  const slides = built.flat();
  if (slides.length > 0) return slides;
  const { image, alt, eyebrow, title, body } = SLIDE_SOURCES[0];
  return [{ image, alt, eyebrow, title, body, price: "", cta: { label: "Shop all parts", href: "/shop" } }];
}
