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
import { CATEGORY_LABELS, OFFERS } from "@/lib/data";
import { getCategoryCounts, getProductBySlug, listProducts } from "@/lib/server/queries";
import type { Category } from "@/lib/types";

const RAIL_CATEGORIES: Category[] = ["stereo", "speaker", "subwoofer", "dashcam", "lighting"];

export default function Home() {
  const products = listProducts();
  const reviews = products.reduce((n, p) => n + p.reviews, 0);
  const stats = {
    // Review-weighted, so a 5-star product with 3 reviews doesn't skew it.
    rating: products.reduce((n, p) => n + p.rating * p.reviews, 0) / Math.max(reviews, 1),
    reviews,
  };
  const spotlight = getProductBySlug("beatdeck-x9-android-stereo");
  const byRating = listProducts({ sort: "rating" });
  const groups: RailGroup[] = [
    { key: "all", label: "All best sellers", href: "/shop?sort=rating", products: byRating.slice(0, 10) },
    ...RAIL_CATEGORIES.map((c) => ({
      key: c,
      label: CATEGORY_LABELS[c],
      href: `/shop?category=${c}`,
      products: byRating.filter((p) => p.category === c),
    })),
  ].filter((g) => g.products.length > 0);

  return (
    <>
      {/* Deals lead: banners and today's price drops, then browsing by category, product and car. */}
      <Hero promos={OFFERS.slice(1)} />
      <TrustBar />
      <TodayDeals />
      <CategoryGrid counts={getCategoryCounts()} />
      {spotlight && <UpgradeSpotlight product={spotlight} />}
      <CategoryRail groups={groups} />
      <GarageSection products={products} />
      <Offers />
      <InstallerSection />
      <InstallGallery />
      <Faq stats={stats} />
    </>
  );
}
