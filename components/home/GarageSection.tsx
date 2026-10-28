"use client";

import { ArrowRight, BookmarkCheck, BookmarkPlus, CarFront, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { productFitsModel } from "@/lib/data";
import { findCar, useCarBrands, useGarage } from "@/lib/garage";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

/** Make chips, then model chips, then the parts that fit. Starts on the saved car if there is one. */
export function GarageSection({ products }: { products: Product[] }) {
  const garage = useGarage();
  const brands = useCarBrands();
  // Until the shopper picks something here, show their saved car (or the Ranger, Australia's best seller).
  const [picked, setPicked] = useState<string | null>(null);
  const [pickedSubModel, setPickedSubModel] = useState("");
  const car =
    findCar(brands, picked ?? garage.car?.model.id ?? "ranger") ?? (brands[0] ? { brand: brands[0], model: brands[0].models[0] } : null);
  if (!car) return null;
  const { brand, model } = car;
  const subModelId = picked === null ? garage.car?.subModel?.id ?? "" : pickedSubModel;
  const subModel = model.subModels?.find((s) => s.id === subModelId);
  const isSaved = garage.car?.model.id === model.id && garage.car.subModel?.id === subModel?.id;

  // Model-specific parts first, then universal ones.
  const matches = products
    .filter((p) => productFitsModel(p, model.id, subModel?.id))
    .sort((a, b) => Number(a.fits === "universal") - Number(b.fits === "universal"));

  return (
    <section id="garage" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading
        eyebrow={garage.car ? "My garage" : "Shop by vehicle"}
        title={
          isSaved ? (
            <>
              Picked for your <span className="text-primary">{brand.name} {subModel?.name ?? model.name}</span>
            </>
          ) : (
            "Parts that fit. No guesswork."
          )
        }
        description="Choose your make and model to see parts made for it, plus universal upgrades that fit anything."
      />

      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:p-7">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">1. Choose a make</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Start with your vehicle brand.</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">{brand.name}</span>
          </div>
          <div role="group" aria-label="Make" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={b.id === brand.id}
              onClick={() => { setPicked(b.models[0].id); setPickedSubModel(""); }}
              className={cn(
                "h-11 shrink-0 rounded-xl border px-5 font-display text-sm font-bold transition-colors",
                b.id === brand.id ? "border-primary bg-primary/10 text-primary" : "bg-background hover:border-foreground/30",
              )}
            >
              {b.name}
            </button>
          ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold">2. Choose a model</span>
            <span className="relative block">
              <select
                aria-label="Model"
                value={model.id}
                onChange={(e) => { setPicked(e.target.value); setPickedSubModel(""); }}
                className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                {brand.models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </span>
          </label>

          <div className="min-w-0">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">3. Choose a sub-model <span className="font-normal text-muted-foreground">(optional)</span></span>
              <span className="relative block">
                <select
                  aria-label="Sub-model (optional)"
                  value={subModelId}
                  onChange={(e) => { setPicked(model.id); setPickedSubModel(e.target.value); }}
                  disabled={!model.subModels?.length}
                  className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-muted disabled:text-muted-foreground"
                >
                  <option value="">{model.subModels?.length ? `Any ${model.name} version` : "No sub-models listed"}</option>
                  {model.subModels?.map((s) => <option key={s.id} value={s.id}>{s.name}{s.years ? ` · ${s.years}` : ""}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </span>
            </label>
            {!model.subModels?.length && <p className="mt-1.5 text-xs text-muted-foreground">We&apos;ll show parts listed for the whole model.</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected vehicle</p>
            <p className="mt-0.5 truncate font-semibold">{brand.name} {model.name}{subModel ? ` · ${subModel.name}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" className="h-10" onClick={() => (isSaved ? garage.clear() : garage.save(model.id, subModel?.id))}>
              {isSaved ? <BookmarkCheck className="text-primary" /> : <BookmarkPlus />}
              {isSaved ? "Saved to garage" : "Save vehicle"}
            </Button>
            <Button asChild variant="ink" className="h-10">
              <Link href={`/shop?model=${model.id}${subModel ? `&submodel=${subModel.id}` : ""}`}>
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
