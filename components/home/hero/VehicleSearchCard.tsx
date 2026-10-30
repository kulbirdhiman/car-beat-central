"use client";

import { vehicleOptionLabel } from "@/lib/fitment-years";

import { CarFront, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { VehicleForm } from "@/components/layout/VehicleForm";
import { useGarage } from "@/lib/garage";
import roadImage from "@/public/images/coast-road.jpg";
import { cn } from "@/lib/utils";

/** Hero tile: pick make and model, then jump straight to parts that fit. */
export function VehicleSearchCard({ fitCounts, department, productLabel = "parts" }: { fitCounts: Record<string, number>; department?: string; productLabel?: string }) {
  const { car } = useGarage();

  return (
    <div className={cn("relative isolate flex min-h-[200px] flex-col overflow-clip rounded-2xl p-5 sm:p-6", department ? "justify-center border bg-card text-card-foreground lg:p-10" : "grain justify-end bg-ink text-white")}>
      {!department && <>
      <Image src={roadImage} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" placeholder="blur" className="-z-10 object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/85 to-ink/40" />
      <div className="absolute -right-16 -top-16 -z-10 size-48 rounded-full bg-primary/40 blur-3xl" />
      </>}

      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <CarFront className="size-5" />
        </span>
        <div className="min-w-0">
          <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wider", department ? "text-primary" : "text-white/60")}>{department ? "Find your fit" : car ? "Welcome back" : "Shop by vehicle"}</p>
          <p className={`${department ? "text-3xl sm:text-4xl" : "truncate text-2xl"} font-display font-extrabold leading-tight`}>
            {department ? "Made for your car." : car ? `Parts for your ${vehicleOptionLabel(car.subModel ?? car.model)}` : `Find ${productLabel} that fit`}
          </p>
        </div>
      </div>

      {department && <p className="mb-3 mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">Choose your vehicle to find matching steering wheels. Add a version and year for a more precise fit.</p>}

      {/* Keyed on the saved car: the garage only loads after hydration, so the form starts on it then. */}
      <VehicleForm key={`${car?.model.id ?? "none"}:${car?.subModel?.id ?? "none"}:${car?.year ?? "all"}`} fitCounts={fitCounts} department={department} productLabel={productLabel} tone={department ? "light" : "dark"} className="mt-4 sm:grid-cols-2" />

      <p className={cn("mt-5 flex items-center gap-1.5 text-xs", department ? "text-muted-foreground" : "text-white/60")}>
        <ShieldCheck className="size-3.5 text-primary" /> Fitment guaranteed, or we pay return postage
      </p>
    </div>
  );
}
