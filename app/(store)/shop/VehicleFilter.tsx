"use client";

import { vehicleOptionLabel, vehicleYearOptions } from "@/lib/fitment-years";

import { ArrowRight, CarFront, CheckCircle2, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { findCar, useCarBrands, useGarage } from "@/lib/garage";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full min-w-0 appearance-none rounded-lg border border-input bg-background pl-3 pr-9 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50";
const chevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23888' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundPosition: "right 10px center",
  backgroundSize: 16,
  backgroundRepeat: "no-repeat",
};

/**
 * Expandable vehicle finder: make → model, one-tap popular cars and the saved garage car.
 * Keeps the shopper's other filters, and saves the choice to the garage.
 */
export function VehicleFilter({ modelId, subModelId, year, fitCounts }: { modelId?: string; subModelId?: string; year?: number; fitCounts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const garage = useGarage();
  const brands = useCarBrands();
  const selected = findCar(brands, modelId ?? null, subModelId ?? null);
  // The vehicles with the most parts in the catalogue (stable sort keeps admin order on ties).
  const popular = brands
    .flatMap((brand) => brand.models.map((model) => ({ brand, model })))
    .sort((a, b) => (fitCounts[b.model.id] ?? 0) - (fitCounts[a.model.id] ?? 0))
    .slice(0, 6);
  const [brandId, setBrandId] = useState(selected?.brand.id ?? "");
  const [pick, setPick] = useState(selected?.model.id ?? "");
  const [pickSubModel, setPickSubModel] = useState(selected?.subModel?.id ?? "");
  const [pickYear, setPickYear] = useState(year ? String(year) : "");
  const brand = brands.find((b) => b.id === brandId);
  const model = brand?.models.find((m) => m.id === pick);

  const yearOptions = vehicleYearOptions(model?.subModels?.find((sub) => sub.id === pickSubModel) ?? model);
  const hrefFor = (id: string | null, subId?: string | null, selectedYear?: number) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (id) next.set("model", id);
    else next.delete("model");
    if (id && subId) next.set("submodel", subId);
    else next.delete("submodel");
    if (id && selectedYear) next.set("year", String(selectedYear));
    else next.delete("year");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const choose = (id: string, subId?: string, selectedYear?: number) => {
    garage.save(id, subId, selectedYear);
    router.push(hrefFor(id, subId, selectedYear), { scroll: false });
  };

  const suggested = garage.car && (garage.car.model.id !== modelId || garage.car.subModel?.id !== subModelId) ? garage.car : null;

  return (
    <details className="group/vehicle overflow-hidden rounded-2xl border bg-card" open={!!selected}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:gap-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CarFront className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold sm:text-base">Shop by vehicle</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground sm:text-sm">Choose your car. Find parts that fit.</span>
        </span>
        <span className="hidden text-xs font-semibold text-primary sm:block">{selected ? "Change vehicle" : "Choose vehicle"}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/vehicle:rotate-180" />
      </summary>
      <div className="border-t bg-muted/25 p-4 sm:p-5">
        {selected && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <span className="min-w-0 flex-1 truncate">
              Fits <strong>{selected.brand.name} {selected.subModel?.name ?? selected.model.name}</strong>
            </span>
            <Link href={hrefFor(null)} scroll={false} aria-label="Clear vehicle" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground">
              <X className="size-3.5" />
            </Link>
          </div>
        )}

        <form
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (pick) choose(pick, pickSubModel || undefined, Number(pickYear) || undefined);
          }}
        >
          <label className="grid min-w-0 gap-1.5 text-xs font-semibold">Make<select
            aria-label="Make"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPick("");
              setPickSubModel(""); setPickYear("");
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
          </select></label>
          <label className="grid min-w-0 gap-1.5 text-xs font-semibold">Model<select aria-label="Model" value={pick} onChange={(e) => { setPick(e.target.value); setPickSubModel(""); setPickYear(""); }} disabled={!brand} className={selectClass} style={chevron}>
            <option value="">{brand ? "Select model" : "Choose a make first"}</option>
            {brand?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {vehicleOptionLabel(m)} ({fitCounts[m.id] ?? 0} products)
              </option>
            ))}
          </select></label>
          {model?.subModels && model.subModels.length > 0 && (
            <label className="grid min-w-0 gap-1.5 text-xs font-semibold">Version (optional)<select aria-label="Sub-model (optional)" value={pickSubModel} onChange={(e) => { setPickSubModel(e.target.value); setPickYear(""); }} className={selectClass} style={chevron}>
              <option value="">Any {model.name} version ({fitCounts[model.id] ?? 0} products)</option>
              {model.subModels.map((sub) => <option key={sub.id} value={sub.id}>{vehicleOptionLabel(sub)} ({fitCounts[sub.id] ?? 0} products)</option>)}
            </select></label>
          )}
          <label className="grid min-w-0 gap-1.5 text-xs font-semibold">Year (optional)<select aria-label="Year" value={pickYear} onChange={(e) => setPickYear(e.target.value)} disabled={!model} className={selectClass} style={chevron}>
            <option value="">All years</option>
            {yearOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select></label>
          <Button type="submit" className="h-11" disabled={!pick || (pick === modelId && (pickSubModel || undefined) === subModelId && (Number(pickYear) || undefined) === year)}>
            {pick && (pick !== modelId || (pickSubModel || undefined) !== subModelId || (Number(pickYear) || undefined) !== year) ? pickYear ? "Show matching parts" : `Show ${fitCounts[pickSubModel || pick] ?? 0} parts` : "Find parts"}<ArrowRight className="size-4" />
          </Button>
        </form>

        {suggested && (
          <button
            type="button"
            onClick={() => choose(suggested.model.id, suggested.subModel?.id, suggested.year)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/50 bg-primary/5 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            <CarFront className="size-3.5" /> Use my {suggested.brand.name} {suggested.subModel?.name ?? suggested.model.name}
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
    </details>
  );
}
