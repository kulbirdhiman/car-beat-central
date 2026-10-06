"use client";

import { CarFront, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { findCar, useCarBrands, useGarage } from "@/lib/garage";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-9 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50";
const chevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23888' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundPosition: "right 10px center",
  backgroundSize: 16,
  backgroundRepeat: "no-repeat",
};

/**
 * Sidebar "Shop by vehicle" filter: make → model, one-tap popular cars and the saved garage car.
 * Keeps the shopper's other filters, and saves the choice to the garage.
 */
export function VehicleFilter({ modelId, fitCounts }: { modelId?: string; fitCounts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const garage = useGarage();
  const brands = useCarBrands();
  const selected = findCar(brands, modelId ?? null);
  // The vehicles with the most parts in the catalogue (stable sort keeps admin order on ties).
  const popular = brands
    .flatMap((brand) => brand.models.map((model) => ({ brand, model })))
    .sort((a, b) => (fitCounts[b.model.id] ?? 0) - (fitCounts[a.model.id] ?? 0))
    .slice(0, 6);
  const [brandId, setBrandId] = useState(selected?.brand.id ?? "");
  const [pick, setPick] = useState(selected?.model.id ?? "");
  const brand = brands.find((b) => b.id === brandId);

  const hrefFor = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("model", id);
    else next.delete("model");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const choose = (id: string) => {
    garage.save(id);
    router.push(hrefFor(id), { scroll: false });
  };

  const suggested = garage.car && garage.car.model.id !== modelId ? garage.car : null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center gap-2.5 bg-ink px-4 py-3 text-ink-foreground">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <CarFront className="size-4" />
        </span>
        <p className="font-semibold">Shop by vehicle</p>
      </div>

      <div className="p-4">
        {selected && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <span className="min-w-0 flex-1 truncate">
              Fits <strong>{selected.brand.name} {selected.model.name}</strong>
            </span>
            <Link href={hrefFor(null)} scroll={false} aria-label="Clear vehicle" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground">
              <X className="size-3.5" />
            </Link>
          </div>
        )}

        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (pick) choose(pick);
          }}
        >
          <select
            aria-label="Make"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPick("");
            }}
            className={selectClass}
            style={chevron}
          >
            <option value="">Select make</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select aria-label="Model" value={pick} onChange={(e) => setPick(e.target.value)} disabled={!brand} className={selectClass} style={chevron}>
            <option value="">{brand ? "Select model" : "Choose a make first"}</option>
            {brand?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Button type="submit" className="h-10" disabled={!pick || pick === modelId}>
            {pick && pick !== modelId ? `Show ${fitCounts[pick] ?? 0} parts` : "Find parts"}
          </Button>
        </form>

        {suggested && (
          <button
            type="button"
            onClick={() => choose(suggested.model.id)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/50 bg-primary/5 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            <CarFront className="size-3.5" /> Use my {suggested.brand.name} {suggested.model.name}
          </button>
        )}

        <p className="mt-4 text-xs font-medium text-muted-foreground">Popular vehicles</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {popular.map((c) => (
            <button
              key={c.model.id}
              type="button"
              onClick={() => choose(c.model.id)}
              aria-pressed={c.model.id === modelId}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
                c.model.id === modelId ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-foreground/30",
              )}
            >
              {c.model.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
