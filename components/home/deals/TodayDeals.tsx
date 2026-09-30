import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { discountPercent, formatPrice } from "@/lib/data";
import { getDeals } from "@/lib/server/queries";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../SectionHeading";
import { Countdown } from "./Countdown";

export function TodayDeals() {
  const deals = getDeals();
  if (deals.length === 0) return null;

  const maxOff = Math.max(...deals.map((p) => discountPercent(p.deal!.price, p.rrp)));
  const maxSaving = Math.max(...deals.map((p) => p.rrp - p.deal!.price));

  return (
    <section id="deals" className="scroll-mt-20 px-4 pb-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      {/* Inset dark panel rather than a full-bleed band, so it reads as a feature, not a new page. */}
      <div className="grain relative mx-auto max-w-[1536px] overflow-clip rounded-3xl bg-ink py-14 text-ink-foreground sm:py-20">
        <div className="pointer-events-none absolute -right-40 -top-56 size-[560px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="relative z-10 px-4 sm:px-8 lg:px-12">
          <SectionHeading
            index="01"
            eyebrow="Today's deals"
            tone="dark"
            title={
              <>
                Price drops.
                <br />
                <span className="text-white/45">Gone at midnight.</span>
              </>
            }
            action={<Countdown />}
          />

          <p className="-mt-4 mb-10 text-sm text-white/60">
            <Zap className="mr-1.5 inline size-4 -translate-y-px fill-primary text-primary" />
            Up to <span className="font-mono font-semibold text-white">{maxOff}% off</span>, and save as much as{" "}
            <span className="font-mono font-semibold text-white">{formatPrice(maxSaving)}</span>. While stock lasts.
          </p>

          <ul className="grid grid-cols-2 gap-2 text-foreground sm:gap-4 lg:grid-cols-4">
            {deals.map((product, i) => {
              const deal = product.deal!;
              const low = deal.claimed > 80;
              return (
                <Reveal as="li" key={product.id} delay={i * 90}>
                  <ProductCard
                    product={product}
                    footer={
                      <div className="mt-3 border-t pt-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs">
                          <span className="whitespace-nowrap font-medium text-success">Save {formatPrice(product.rrp - deal.price)}</span>
                          <span className={cn("whitespace-nowrap font-mono", low ? "font-semibold text-destructive" : "text-muted-foreground")}>
                            {deal.claimed}% claimed
                          </span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={deal.claimed} aria-valuemin={0} aria-valuemax={100} aria-label="Deal stock claimed">
                          <div className={cn("h-full rounded-full", low ? "bg-destructive" : "bg-primary")} style={{ width: `${deal.claimed}%` }} />
                        </div>
                      </div>
                    }
                  />
                </Reveal>
              );
            })}
          </ul>

          <Reveal className="mt-10 flex justify-center">
            <Button asChild size="xl" variant="outline" className="group border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/5 hover:text-white">
              <Link href="/shop?sale=1">
                Shop all deals
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
