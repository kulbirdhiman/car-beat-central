import { Zap } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Progress } from "@/components/ui/progress";
import { Reveal } from "@/components/ui/Reveal";
import { getDeals } from "@/lib/server/queries";
import { Countdown } from "./Countdown";

export function TodayDeals() {
  return (
    <section
      id="deals"
      className="relative scroll-mt-20 overflow-clip bg-ink py-20 text-ink-foreground sm:py-28"
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
          </div>
          <Countdown />
        </Reveal>

        <ul className="grid grid-cols-2 gap-3 text-foreground sm:gap-5 lg:grid-cols-4">
          {getDeals().map((product, i) => {
            const deal = product.deal!;
            return (
              <Reveal as="li" key={product.id} delay={i * 90}>
                <ProductCard
                  product={product}
                  footer={
                    <div className="mt-3 space-y-1.5">
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
      </div>
    </section>
  );
}
