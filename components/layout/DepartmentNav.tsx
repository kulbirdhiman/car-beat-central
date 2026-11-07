"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { StoreDepartment } from "@/lib/types";
import { useCarBrands, useGarage } from "@/lib/garage";
import { vehicleOptionLabel, vehicleYearOptions } from "@/lib/fitment-years";

export function DepartmentNav({ departments }: { departments: StoreDepartment[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!departments.length) return null;

  return (
    <nav aria-label="Departments" className="rounded-b-2xl border-t border-border/60 bg-secondary/35 px-2 sm:px-4">
      <ul className="flex items-center gap-1 overflow-x-auto py-2">
        {departments.map((department) => (
          <li key={department.id} className="shrink-0">
            <Popover open={openId === department.id} onOpenChange={(open) => setOpenId(open ? department.id : null)}>
              <PopoverTrigger asChild>
                <button type="button" className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-primary data-[state=open]:bg-primary data-[state=open]:text-primary-foreground">
                  <span className="relative size-7 overflow-hidden rounded-lg bg-white">
                    <Image src={department.image} alt="" fill sizes="28px" className="object-cover" />
                  </span>
                  {department.name}
                  <ChevronDown className="size-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={12} collisionPadding={12} className="max-h-[min(680px,var(--radix-popover-content-available-height))] w-[min(580px,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl p-0">
                <div className="flex items-center gap-4 border-b bg-secondary/40 p-5">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image src={department.image} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Shop by vehicle</p>
                    <h2 className="mt-1 font-display text-xl font-bold">{department.name}</h2>
                    <Link href={`/shop?dept=${department.slug}`} onClick={() => setOpenId(null)} className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                      Browse all {department.count} products <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="p-5">
                  {openId === department.id && <DepartmentVehicles department={department.slug} onDone={() => setOpenId(null)} />}
                </div>
              </PopoverContent>
            </Popover>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DepartmentVehicles({ department, onDone }: { department: string; onDone: () => void }) {
  const brands = useCarBrands();
  const garage = useGarage();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [subModelId, setSubModelId] = useState<string | null>(null);
  const brand = brands.find((item) => item.id === brandId);
  const model = brand?.models.find((item) => item.id === modelId);
  const subModel = model?.subModels?.find((item) => item.id === subModelId);
  const showSubModels = !!model?.subModels?.length && !subModel;
  const years = vehicleYearOptions(subModel ?? model);
  const itemClass = "flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary";
  const href = (year?: number) => {
    const params = new URLSearchParams({ dept: department, model: modelId! });
    if (subModelId) params.set("submodel", subModelId);
    if (year) params.set("year", String(year));
    return `/shop?${params}`;
  };
  const finish = (year?: number) => {
    garage.save(modelId!, subModelId ?? undefined, year);
    onDone();
  };

  return (
    <div>
      {brand && (
        <button type="button" onClick={() => subModelId ? setSubModelId(null) : modelId ? setModelId(null) : setBrandId(null)} className="mb-4 flex items-center gap-1.5 rounded text-sm font-semibold text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
          <ArrowLeft className="size-4" /> {subModelId ? "Back to submodels" : modelId ? "All models" : "All makes"}
        </button>
      )}
      <h3 className="font-semibold">{!brand ? "Choose your car make" : !model ? `${brand.name} · Choose a model` : showSubModels ? `${model.name} · Choose a submodel` : `${subModel?.name ?? model.name} · Choose a year`}</h3>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">{!brand ? "Select a make below to continue." : "Narrow down the products for your vehicle."}</p>
      {!brand ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {brands.filter((item) => item.models.length).map((item) => (
            <button key={item.id} type="button" className={itemClass} onClick={() => setBrandId(item.id)}>{item.name}<ArrowRight className="size-4 shrink-0 opacity-50" /></button>
          ))}
          {!brands.some((brand) => brand.models.length) && <p className="text-sm text-muted-foreground">No vehicle models available yet. Browse all products above.</p>}
        </div>
      ) : !model ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {brand.models.map((item) => <button key={item.id} type="button" className={itemClass} onClick={() => setModelId(item.id)}>{item.name}<ArrowRight className="size-4 shrink-0 opacity-50" /></button>)}
        </div>
      ) : (
        <>
          <Link href={href()} onClick={() => finish()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">{showSubModels ? `Shop all ${model.name}` : "Shop all years"}<ArrowUpRight className="size-4" /></Link>
          <div className={showSubModels ? "grid gap-2 sm:grid-cols-2" : "grid grid-cols-3 gap-2 sm:grid-cols-4"}>
            {showSubModels ? model.subModels!.map((item) => (
              <button key={item.id} type="button" className={itemClass} onClick={() => setSubModelId(item.id)}>{vehicleOptionLabel(item)}<ArrowRight className="size-4 shrink-0 opacity-50" /></button>
            )) : years.map((year) => <Link key={year} href={href(year)} onClick={() => finish(year)} className={itemClass}>{year}<ArrowRight className="size-3 shrink-0 opacity-50" /></Link>)}
          </div>
          {!showSubModels && !years.length && <p className="text-sm text-muted-foreground">No year information available. Use “Shop all years” to continue.</p>}
        </>
      )}
    </div>
  );
}
