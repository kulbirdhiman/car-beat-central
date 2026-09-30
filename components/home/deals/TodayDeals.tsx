import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { discountPercent, formatPrice } from "@/lib/data";
import { getDeals } from "@/lib/server/queries";
import { cn } from "@/lib/utils";
import { Countdown } from "./Countdown";

export function TodayDeals() {
  const deals = getDeals();
  if (deals.length === 0) return null;

  const maxOff = Math.max(...deals.map((p) => discountPercent(p.deal!.price, p.rrp)));
  const maxSaving = Math.max(...deals.map((p) => p.rrp - p.deal!.price));

  return (
    <section id="deals" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
      <div className="grain relative overflow-clip rounded-3xl bg-ink p-4 text-ink-foreground sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-40 -top-56 size-[560px] rounded-full bg-primary/25 blur-[140px]" />

        <Reveal className="relative z-10 mb-8 flex flex-wrap items-end justify-between gap-6 px-2 pt-2 sm:px-0 sm:pt-0">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
              <Zap className="size-3.5 fill-current" /> Today&apos;s deals
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.05] sm:text-4xl lg:text-5xl">Price drops. Gone at midnight.</h2>
            <p className="mt-3 text-white/65">
              Up to <span className="font-semibold text-white">{maxOff}% off</span>, save as much as{" "}
              <span className="font-semibold text-white">{formatPrice(maxSaving)}</span>. While stock lasts.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Ends in</span>
            <Countdown />
          </div>
        </Reveal>

        <ul className="relative z-10 grid grid-cols-2 gap-2 text-foreground sm:gap-4 lg:grid-cols-4">
          {deals.map((product, i) => {
            const deal = product.deal!;
            const low = deal.claimed > 80;
            return (
              <Reveal as="li" key={product.id} delay={i * 80}>
                <ProductCard
                  product={product}
                  footer={
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className={cn("whitespace-nowrap font-medium", low ? "text-destructive" : "text-muted-foreground")}>{low ? "Almost gone" : "Selling fast"}</span>
                        <span className="whitespace-nowrap font-mono text-muted-foreground">
                          {deal.claimed}%<span className="hidden sm:inline"> claimed</span>
                        </span>
                      </div>
                      <div
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={deal.claimed}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Deal stock claimed"
                      >
                        <div className={cn("h-full rounded-full", low ? "bg-destructive" : "bg-primary")} style={{ width: `${deal.claimed}%` }} />
                      </div>
                    </div>
                  }
                />
              </Reveal>
            );
          })}
        </ul>

        <div className="relative z-10 mt-6 flex justify-center sm:mt-8">
          <Link href="/shop?sale=1" className="group inline-flex items-center gap-2 text-sm font-semibold text-white/85 transition-colors hover:text-white">
            Shop all deals <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
