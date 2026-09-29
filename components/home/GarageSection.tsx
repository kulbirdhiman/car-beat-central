"use client";

import { BookmarkCheck, BookmarkPlus, CarFront } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
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
    <section id="garage" className="scroll-mt-20 bg-secondary/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <CarFront className="size-4" /> {garage.car ? "My garage" : "Shop by car"}
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
              {isSaved ? (
                <>
                  Picked for your <span className="text-primary">{brand.name} {model.name}</span>
                </>
              ) : (
                <>Parts that fit. No guesswork.</>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={brand.id} onValueChange={(id) => setPicked(CAR_BRANDS.find((b) => b.id === id)!.models[0].id)}>
              <SelectTrigger className="h-11! w-40 bg-background" aria-label="Make">
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
            <Select value={model.id} onValueChange={setPicked}>
              <SelectTrigger className="h-11! w-40 bg-background" aria-label="Model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brand.models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={isSaved ? "secondary" : "default"}
              className="h-11 px-4"
              onClick={() => (isSaved ? garage.clear() : garage.save(model.id))}
            >
              {isSaved ? <BookmarkCheck /> : <BookmarkPlus />}
              {isSaved ? "Saved to garage" : `Save my ${model.name}`}
            </Button>
          </div>
        </Reveal>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {brand.models.map((m) => (
            <Badge
              key={m.id}
              asChild
              variant={m.id === model.id ? "default" : "outline"}
              className={cn("h-8 cursor-pointer px-3.5 text-sm", m.id !== model.id && "bg-background")}
            >
              <button type="button" onClick={() => setPicked(m.id)}>
                {m.name}
              </button>
            </Badge>
          ))}
          <Link href={`/shop?model=${model.id}`} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            See all <span className="font-semibold text-foreground">{matches.length}</span> parts for the {brand.name} {model.name} →
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
