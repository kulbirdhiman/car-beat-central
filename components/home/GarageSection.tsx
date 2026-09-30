"use client";

import { ArrowRight, BookmarkCheck, BookmarkPlus, CarFront } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { CAR_BRANDS, productFitsModel } from "@/lib/data";
import { findCar, useGarage } from "@/lib/garage";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

/** Make chips, then model chips, then the parts that fit. Starts on the saved car if there is one. */
export function GarageSection({ products }: { products: Product[] }) {
  const garage = useGarage();
  // Until the shopper picks something here, show their saved car (or the Ranger, Australia's best seller).
  const [picked, setPicked] = useState<string | null>(null);
  const { brand, model } = findCar(picked ?? garage.car?.model.id ?? "ranger")!;
  const isSaved = garage.car?.model.id === model.id;

  // Model-specific parts first, then universal ones.
  const matches = products
    .filter((p) => productFitsModel(p, model.id))
    .sort((a, b) => Number(a.fits === "universal") - Number(b.fits === "universal"));

  return (
    <section id="garage" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading
        eyebrow={garage.car ? "My garage" : "Shop by vehicle"}
        title={
          isSaved ? (
            <>
              Picked for your <span className="text-primary">{brand.name} {model.name}</span>
            </>
          ) : (
            "Parts that fit. No guesswork."
          )
        }
        description="Choose your make and model to see parts made for it, plus universal upgrades that fit anything."
      />

      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        <div role="group" aria-label="Make" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {CAR_BRANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={b.id === brand.id}
              onClick={() => setPicked(b.models[0].id)}
              className={cn(
                "h-11 shrink-0 rounded-xl border px-5 font-display text-sm font-bold transition-colors",
                b.id === brand.id ? "border-primary bg-primary/10 text-primary" : "bg-background hover:border-foreground/30",
              )}
            >
              {b.name}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
          <div role="group" aria-label={`${brand.name} models`} className="flex flex-wrap gap-1.5">
            {brand.models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPicked(m.id)}
                aria-pressed={m.id === model.id}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                  m.id === model.id ? "bg-foreground text-background" : "bg-muted text-foreground/75 hover:text-foreground",
                )}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-9" onClick={() => (isSaved ? garage.clear() : garage.save(model.id))}>
              {isSaved ? <BookmarkCheck className="text-primary" /> : <BookmarkPlus />}
              {isSaved ? "Saved to garage" : `Save my ${model.name}`}
            </Button>
            <Button asChild variant="ink" className="h-9">
              <Link href={`/shop?model=${model.id}`}>
                <CarFront /> All {matches.length} parts <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <ul key={model.id} className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {matches.slice(0, 4).map((p, i) => (
          <li key={p.id} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500" style={{ animationDelay: `${i * 70}ms` }}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
