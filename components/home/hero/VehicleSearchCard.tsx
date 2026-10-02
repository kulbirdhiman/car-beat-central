"use client";

import { CarFront, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { VehicleForm } from "@/components/layout/VehicleForm";
import { useGarage } from "@/lib/garage";
import roadImage from "@/public/images/coast-road.jpg";

/** Hero tile: pick make and model, then jump straight to parts that fit. */
export function VehicleSearchCard({ fitCounts }: { fitCounts: Record<string, number> }) {
  const { car } = useGarage();

  return (
    <div className="grain relative isolate flex min-h-[200px] flex-col justify-end overflow-clip rounded-2xl bg-ink p-5 text-white sm:p-6">
      <Image src={roadImage} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" placeholder="blur" className="-z-10 object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/85 to-ink/40" />
      <div className="absolute -right-16 -top-16 -z-10 size-48 rounded-full bg-primary/40 blur-3xl" />

      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <CarFront className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{car ? "Welcome back" : "Shop by vehicle"}</p>
          <p className="truncate font-display text-2xl font-extrabold leading-tight">
            {car ? `Parts for your ${car.model.name}` : "Find parts that fit"}
          </p>
        </div>
      </div>

      {/* Keyed on the saved car: the garage only loads after hydration, so the form starts on it then. */}
      <VehicleForm key={car?.model.id ?? "none"} fitCounts={fitCounts} tone="dark" className="mt-4 grid-cols-2" />

      <p className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
        <ShieldCheck className="size-3.5 text-primary" /> Fitment guaranteed, or we pay return postage
      </p>
    </div>
  );
}
