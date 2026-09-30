"use client";

import { BookmarkCheck, BookmarkPlus, CarFront } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";
import { CAR_BRANDS, productFitsModel } from "@/lib/data";
import { findCar, useGarage } from "@/lib/garage";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GarageSection({ products }: { products: Product[] }) {
  const garage = useGarage();
  // Until the shopper picks something here, show their saved car (or the Ranger, Australia's best seller).
  const [picked, setPicked] = useState<string | null>(null);
  const { brand, model } = findCar(picked ?? garage.car?.model.id ?? "ranger")!;
  const isSaved = garage.car?.model.id === model.id;

  // Model-specific parts first, then universal ones.
  const matches = products.filter((p) => productFitsModel(p, model.id)).sort(
    (a, b) => Number(a.fits === "universal") - Number(b.fits === "universal"),
  );

  return (
    <section id="garage" className="scroll-mt-20 pb-20 pt-16 sm:pb-28 sm:pt-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10">
          <div className="flex items-center gap-3 border-t border-foreground/15 pt-4 text-muted-foreground">
            <span className="label-mono text-primary">03</span>
            <span className="label-mono flex items-center gap-2">
              <CarFront className="size-3.5" /> {garage.car ? "My garage" : "Shop by car"}
            </span>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_auto] lg:items-end">
            <h2 className="font-display text-4xl font-bold leading-[1.02] sm:text-5xl">
              {isSaved ? (
                <>
                  Picked for your <span className="text-primary">{brand.name} {model.name}</span>
                </>
              ) : (
                <>Parts that fit. No guesswork.</>
              )}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={brand.id} onValueChange={(id) => setPicked(CAR_BRANDS.find((b) => b.id === id)!.models[0].id)}>
                <SelectTrigger className="h-11! w-40 bg-card" aria-label="Make">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAR_BRANDS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={isSaved ? "outline" : "ink"}
                className="h-11 px-4"
                onClick={() => (isSaved ? garage.clear() : garage.save(model.id))}
              >
                {isSaved ? <BookmarkCheck className="text-primary" /> : <BookmarkPlus />}
                {isSaved ? "Saved to garage" : `Save my ${model.name}`}
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Model switcher: segmented control on the left, "see all" link on the right. */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div role="group" aria-label={`${brand.name} models`} className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {brand.models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPicked(m.id)}
                aria-pressed={m.id === model.id}
                className={cn(
                  "h-9 shrink-0 rounded-md px-4 text-sm font-medium transition-all",
                  m.id === model.id ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/5" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.name}
              </button>
            ))}
          </div>
          <Link href={`/shop?model=${model.id}`} className="group ml-auto text-sm text-muted-foreground transition-colors hover:text-foreground">
            See all <span className="font-mono font-semibold text-foreground">{matches.length}</span> parts for the {brand.name} {model.name}{" "}
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <ul key={model.id} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {matches.slice(0, 4).map((p, i) => (
            <li key={p.id} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500" style={{ animationDelay: `${i * 70}ms` }}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
