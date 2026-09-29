import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTrending } from "@/lib/server/queries";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";
import { TrendingCarousel } from "./TrendingCarousel";

export function Trending() {
  return (
    <section id="trending" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Trending this week"
          title="What Aussies are bolting in"
          description="Based on orders from the last 7 days."
          action={
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/shop">Shop all parts</Link>
            </Button>
          }
        />
        <Reveal>
          <TrendingCarousel products={getTrending()} />
        </Reveal>
      </div>
    </section>
  );
}
