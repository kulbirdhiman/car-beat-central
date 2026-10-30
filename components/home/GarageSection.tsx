"use client";

import { vehicleYearOptions } from "@/lib/fitment-years";

import { ArrowRight, BookmarkCheck, BookmarkPlus, CarFront, Check, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { productFitsModel } from "@/lib/data";
import { findCar, useCarBrands, useGarage } from "@/lib/garage";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

const optionClass = "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring";

// Production years belong in the final step, even when imported names include them.
const modelName = (name: string) => name.replace(/\s*[（(]?\d{4}\s*[–—-]\s*(?:\d{4}|present|onwards)[)）]?/gi, "").trim();

/** Cascading vehicle picker, starting with the shopper's saved vehicle. */
export function GarageSection({ products }: { products: Product[] }) {
  const router = useRouter();
  const garage = useGarage();
  const brands = useCarBrands();
  // Until the shopper picks something here, show their saved car (or the Ranger, Australia's best seller).
  const [picked, setPicked] = useState<string | null>(null);
  const [pickedSubModel, setPickedSubModel] = useState("");
  const [pickedYear, setPickedYear] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [step, setStep] = useState<"model" | "submodel" | "year">("model");
  const car =
    findCar(brands, picked ?? garage.car?.model.id ?? "ranger") ?? (brands[0] ? { brand: brands[0], model: brands[0].models[0] } : null);
  if (!car) return null;
  const { brand, model } = car;
  const subModelId = picked === null ? garage.car?.subModel?.id ?? "" : pickedSubModel;
  const subModel = model.subModels?.find((s) => s.id === subModelId);
  const year = picked === null ? garage.car?.year : Number(pickedYear) || undefined;
  const yearOptions = vehicleYearOptions(subModel ?? model);
  const isSaved = garage.car?.model.id === model.id && garage.car.subModel?.id === subModel?.id && garage.car.year === year;

  // Model-specific parts first, then universal ones.
  const matches = products
    .filter((p) => productFitsModel(p, model.id, subModel?.id, year))
    .sort((a, b) => Number(a.fits === "universal") - Number(b.fits === "universal"));

  return (
    <section id="garage" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading
        eyebrow={garage.car ? "My garage" : "Shop by vehicle"}
        title={
          isSaved ? (
            <>
              Picked for your <span className="text-primary">{brand.name} {modelName((subModel ?? model).name)}</span>
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
              onClick={() => { setPicked(b.models[0].id); setPickedSubModel(""); setPickedYear(""); setStep("model"); setMenuOpen(true); }}
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

        <div className="mt-5 border-t pt-5">
          <p className="mb-2 text-sm font-semibold">2. Choose your model</p>
          <Popover open={menuOpen} onOpenChange={(open) => { setMenuOpen(open); if (open) setStep("model"); }}>
            <PopoverTrigger asChild>
              <button type="button" aria-label="Choose model, sub-model and year" className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-4 text-left text-sm font-medium transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-ring">
                {modelName(model.name)}
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0" aria-label="Choose your vehicle">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">{brand.name} · Find your vehicle</p>
                <span className="text-xs text-muted-foreground" aria-live="polite">{step === "model" ? "Choose a model" : step === "submodel" ? "Choose a sub-model" : "Choose a year"}</span>
              </div>
              <div className="max-h-[65vh] overflow-y-auto">
                {step === "model" && <div className="p-3">
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:max-h-80 md:grid-cols-3 md:overflow-y-auto lg:grid-cols-4">
                    {brand.models.map((m) => (
                      <button key={m.id} type="button" aria-pressed={m.id === model.id} onClick={() => { setPicked(m.id); setPickedSubModel(""); setPickedYear(""); setStep(m.subModels?.length ? "submodel" : "year"); }} className={cn(optionClass, m.id === model.id && "bg-primary/10 text-primary")}>
                        <span>{modelName(m.name)}</span><ChevronRight className="size-4 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>}
                {step === "submodel" && <div className="p-3">
                  <button type="button" onClick={() => setStep("model")} className="mb-3 text-xs text-primary">← Models</button>
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sub-model</p>
                  {(
                    <div className="space-y-1 md:max-h-80 md:overflow-y-auto">
                      <button type="button" onClick={() => { setPicked(model.id); setPickedSubModel(""); setPickedYear(""); setStep("year"); }} className={cn(optionClass, !subModelId && "bg-primary/10 text-primary")}>
                        <span>{model.subModels?.length ? "Any sub-model" : "All versions"}</span><ChevronRight className="size-4 shrink-0" />
                      </button>
                      {model.subModels?.map((sub) => (
                        <button key={sub.id} type="button" aria-pressed={sub.id === subModelId} onClick={() => { setPicked(model.id); setPickedSubModel(sub.id); setPickedYear(""); setStep("year"); }} className={cn(optionClass, sub.id === subModelId && "bg-primary/10 text-primary")}>
                          <span>{modelName(sub.name)}</span><ChevronRight className="size-4 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>}
                {step === "year" && <div className="p-3">
                  <button type="button" onClick={() => setStep(model.subModels?.length ? "submodel" : "model")} className="mb-3 text-xs text-primary">← {model.subModels?.length ? "Sub-models" : "Models"}</button>
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Year</p>
                  {(
                    <div className="space-y-1 md:max-h-80 md:overflow-y-auto">
                      {[undefined, ...yearOptions].map((value) => (
                        <button key={value ?? "all"} type="button" aria-pressed={year === value} onClick={() => { setPicked(model.id); setPickedSubModel(subModelId); setPickedYear(value ? String(value) : ""); setMenuOpen(false);
                          garage.save(model.id, subModelId || undefined, value);
                          const params = new URLSearchParams({ model: model.id });
                          if (subModelId) params.set("submodel", subModelId);
                          if (value) params.set("year", String(value));
                          router.push(`/shop?${params.toString()}`); }} className={cn(optionClass, year === value && "bg-primary/10 text-primary")}>
                          <span>{value ?? "All years"}</span>{year === value && <Check className="size-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>}
              </div>
            </PopoverContent>
          </Popover>
          <p className="mt-2 text-xs text-muted-foreground">Model → Sub-model → Year</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected vehicle</p>
            <p className="mt-0.5 truncate font-semibold">{brand.name} {subModel ? `${modelName(model.name)} · ${modelName(subModel.name)}` : modelName(model.name)}{year ? ` · ${year}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" className="h-10" onClick={() => (isSaved ? garage.clear() : garage.save(model.id, subModel?.id, year))}>
              {isSaved ? <BookmarkCheck className="text-primary" /> : <BookmarkPlus />}
              {isSaved ? "Saved to garage" : "Save vehicle"}
            </Button>
            <Button asChild variant="ink" className="h-10">
              <Link href={`/shop?model=${model.id}${subModel ? `&submodel=${subModel.id}` : ""}${year ? `&year=${year}` : ""}`}>
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
