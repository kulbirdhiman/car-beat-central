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
import { VehicleSearchCard } from "@/components/home/hero/VehicleSearchCard";
import { SteeringWheelGallery } from "@/components/home/SteeringWheelGallery";
import Link from "next/link";
import { SLIDE_SOURCES, type Slide } from "@/components/home/hero/slides";
import { discountPercent, findDepartment, formatPrice, productFitsModel } from "@/lib/data";
import { getHomeData, productPrice } from "@/lib/server/home-data";
import type { Product, StoreDepartment } from "@/lib/types";
import { connection } from "next/server";

export default async function Home() {
  await connection();
  const { products, departments, byRating, offers, coupons, brands, fitCounts, deals } = await getHomeData();
  const reviews = products.reduce((n, p) => n + p.reviews, 0);
  const stats = {
    // Review-weighted, so a 5-star product with 3 reviews doesn't skew it.
    rating: products.reduce((n, p) => n + p.rating * p.reviews, 0) / Math.max(reviews, 1),
    reviews,
  };
  // Keep the vehicle search and counts scoped to the steering wheel department.
  const steeringDepartment = findDepartment(departments, (d) => /steering[\s-]*wheels?/i.test(d.name));
  const steeringProducts = steeringDepartment ? products.filter((p) => p.departmentId === steeringDepartment.department.id || p.departmentParentId === steeringDepartment.department.id) : [];
  const steeringWheel = steeringProducts[0];
  const steeringColours = [...new Set(steeringProducts.flatMap((p) => (p.optionGroups ?? []).filter((group) => /colou?r/i.test(group.name)).flatMap((group) => group.values.map((value) => value.name))))];
  const steeringCounts = Object.fromEntries(brands.flatMap((brand) => brand.models.flatMap((model) => [
    [model.id, steeringProducts.filter((p) => productFitsModel(p, model.id)).length] as const,
    ...(model.subModels ?? []).map((sub) => [sub.id, steeringProducts.filter((p) => productFitsModel(p, model.id, sub.id)).length] as const),
  ])));
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
      <Hero slides={buildSlides(departments, brands, products)} promo={offers[0]} fitCounts={fitCounts} />
      <TrustBar />
      <TodayDeals deals={deals} />
      <CategoryGrid departments={departments} />
      {steeringWheel && steeringDepartment && (
        <section id="steering-wheels" aria-labelledby="steering-wheels-title" className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="rounded-[2rem] border bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Steering wheel collection</p>
                <h2 id="steering-wheels-title" className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Your drive. Your style.</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Explore the designs and colours, then find the steering wheel made for your vehicle.</p>
              </div>
              <Link href={`/shop?dept=${encodeURIComponent(steeringDepartment.department.slug)}`} className="rounded-full border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">Explore the collection →</Link>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <SteeringWheelGallery wheels={steeringProducts.map(({ id, name, slug, image }) => ({ id, name, slug, image }))} colours={steeringColours} />
              <VehicleSearchCard fitCounts={steeringCounts} department={steeringDepartment.department.slug} productLabel="steering wheels" />
            </div>
          </div>
        </section>
      )}
      <CategoryRail groups={groups} />
      <GarageSection products={products} />
      <Offers offers={offers} />
      <InstallerSection />
      <InstallGallery products={products} />
      <Faq stats={stats} codes={codes} />
    </>
  );
}

/** Banners whose department or vehicle has products, priced from those products. Always at least one. */
function buildSlides(departments: StoreDepartment[], brands: Awaited<ReturnType<typeof getHomeData>>["brands"], allProducts: Product[]): Slide[] {
  const models = brands.flatMap((brand) => brand.models);
  const built = SLIDE_SOURCES.map(({ target, ...copy }): Slide[] => {
    if ("dept" in target) {
      const dept = findDepartment(departments, (d) => d.slug === target.dept)?.department;
      const products = dept ? allProducts.filter((product) => product.departmentId === dept.id || product.departmentParentId === dept.id) : [];
      if (!dept || products.length === 0) return [];
      const from = Math.min(...products.map(productPrice));
      return [{ ...copy, price: `From ${formatPrice(from)}`, cta: { label: `Shop ${dept.name.toLowerCase()}`, href: `/shop?dept=${dept.slug}` } }];
    }
    if (!models.some((m) => m.id === target.model)) return [];
    const products = allProducts.filter((product) => productFitsModel(product, target.model));
    if (products.length === 0) return [];
    const best = Math.max(...products.map((p) => discountPercent(productPrice(p), p.rrp)));
    return [{ ...copy, price: best > 0 ? `Save up to ${best}%` : `${products.length} parts that fit`, cta: { label: target.label, href: `/shop?model=${target.model}` } }];
  });
  const slides = built.flat();
  if (slides.length > 0) return slides;
  const { image, alt, eyebrow, title, body } = SLIDE_SOURCES[0];
  return [{ image, alt, eyebrow, title, body, price: "", cta: { label: "Shop all parts", href: "/shop" } }];
}
