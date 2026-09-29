import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/Reveal";
import { discountPercent, formatPrice } from "@/lib/data";
import { getDeals } from "@/lib/server/queries";
import { Countdown } from "./Countdown";

export function TodayDeals() {
  const deals = getDeals();
  if (deals.length === 0) return null;

  const maxOff = Math.max(...deals.map((p) => discountPercent(p.deal!.price, p.rrp)));
  const maxSaving = Math.max(...deals.map((p) => p.rrp - p.deal!.price));

  return (
    <section
      id="deals"
      className="relative scroll-mt-20 overflow-clip border-t border-white/10 bg-ink pb-20 pt-14 text-ink-foreground sm:pb-24 sm:pt-16"
    >
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <Zap className="size-4 fill-primary" /> Today&apos;s deals
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
              Price drops. Gone at midnight.
            </h2>
            <p className="mt-3 text-white/70">
              Up to <span className="font-semibold text-white">{maxOff}% off</span> · save as much as{" "}
              <span className="font-semibold text-white">{formatPrice(maxSaving)}</span>. While stock lasts.
            </p>
          </div>
          <Countdown />
        </Reveal>

        <ul className="grid grid-cols-2 gap-3 text-foreground sm:gap-5 lg:grid-cols-4">
          {deals.map((product, i) => {
            const deal = product.deal!;
            return (
              <Reveal as="li" key={product.id} delay={i * 90}>
                <ProductCard
                  product={product}
                  footer={
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-semibold text-success">You save {formatPrice(product.rrp - deal.price)}</p>
                      <Progress
                        value={deal.claimed}
                        className="h-1.5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-primary [&>[data-slot=progress-indicator]]:to-destructive"
                      />
                      <p className="text-xs text-muted-foreground">
                        <span
                          className={
                            deal.claimed > 80
                              ? "font-medium text-destructive"
                              : "font-medium text-foreground"
                          }
                        >
                          {deal.claimed}% claimed
                        </span>
                        {deal.claimed > 80 && " · almost gone"}
                      </p>
                    </div>
                  }
                />
              </Reveal>
            );
          })}
        </ul>

        <Reveal className="mt-10 flex justify-center">
          <Button asChild size="lg" className="group h-12 rounded-full px-6 text-base">
            <Link href="/shop?sale=1">
              Shop all deals
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
