import { CategoryGrid } from "@/components/home/CategoryGrid";
import { TodayDeals } from "@/components/home/deals/TodayDeals";
import { Faq } from "@/components/home/Faq";
import { FittingCta } from "@/components/home/FittingCta";
import { GarageSection } from "@/components/home/GarageSection";
import { Hero } from "@/components/home/hero/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Offers } from "@/components/home/offers/Offers";
import { TopProducts } from "@/components/home/TopProducts";
import { Trending } from "@/components/home/Trending";
import { TrustBar } from "@/components/home/TrustBar";
import { CAR_BRANDS, productFitsModel } from "@/lib/data";
import { getCategoryCounts, listProducts } from "@/lib/server/queries";

export default function Home() {
  const products = listProducts();
  const fitCounts = Object.fromEntries(
    CAR_BRANDS.flatMap((b) => b.models).map((m) => [m.id, products.filter((p) => productFitsModel(p, m.id)).length]),
  );

  return (
    <>
      <Hero fitCounts={fitCounts} />
      {/* Deals lead: time-limited price drops, then promo codes, then browsing. */}
      <Offers />
      <TodayDeals />
      <TrustBar />
      <CategoryGrid counts={getCategoryCounts()} />
      <Trending />
      <GarageSection products={products} />
      <TopProducts products={listProducts({ sort: "rating" })} />
      <HowItWorks />
      <FittingCta />
      <Faq />
    </>
  );
}
