import { CategoryGrid } from "@/components/home/CategoryGrid";
import { TodayDeals } from "@/components/home/deals/TodayDeals";
import { Faq } from "@/components/home/Faq";
import { FittingCta } from "@/components/home/FittingCta";
import { GarageSection } from "@/components/home/GarageSection";
import { Hero } from "@/components/home/hero/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ModelMarquee } from "@/components/home/ModelMarquee";
import { Offers } from "@/components/home/offers/Offers";
import { Trending } from "@/components/home/Trending";
import { TrustBar } from "@/components/home/TrustBar";
import { CAR_BRANDS, FITTING_CITIES, productFitsModel } from "@/lib/data";
import { getCategoryCounts, listProducts } from "@/lib/server/queries";

export default function Home() {
  const products = listProducts();
  const fitCounts = Object.fromEntries(
    CAR_BRANDS.flatMap((b) => b.models).map((m) => [m.id, products.filter((p) => productFitsModel(p, m.id)).length]),
  );
  const reviews = products.reduce((n, p) => n + p.reviews, 0);
  const stats = {
    // Review-weighted, so a 5-star product with 3 reviews doesn't skew it.
    rating: products.reduce((n, p) => n + p.rating * p.reviews, 0) / Math.max(reviews, 1),
    reviews,
    cities: FITTING_CITIES.length,
  };

  return (
    <>
      <Hero fitCounts={fitCounts} stats={stats} />
      <TrustBar />
      {/* Time-limited deals lead, then browsing by category and by car. */}
      <TodayDeals />
      <CategoryGrid counts={getCategoryCounts()} />
      <ModelMarquee />
      <GarageSection products={products} />
      <Offers />
      <Trending />
      <HowItWorks />
      <FittingCta />
      <Faq />
    </>
  );
}
