"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCarBrands, useGarage } from "@/lib/garage";
import { cn } from "@/lib/utils";

const chevron = (stroke: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='${stroke}' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const selectBase =
  "h-11 w-full appearance-none rounded-lg border pl-3 pr-9 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50";

const tones = {
  light: { select: "bg-background", stroke: "%23888" },
  dark: { select: "border-white/15 bg-white/10 text-white [&>option]:text-foreground", stroke: "%23ffffffaa" },
};

/**
 * Make → model form that saves the car to the garage and opens the matching parts.
 * Starts on the saved car, so "change" is one tap away. `fitCounts`: products per model id.
 */
export function VehicleForm({
  fitCounts,
  tone = "light",
  onDone,
  className,
}: {
  fitCounts: Record<string, number>;
  tone?: keyof typeof tones;
  onDone?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const garage = useGarage();
  const brands = useCarBrands();
  const [brandId, setBrandId] = useState(garage.car?.brand.id ?? "");
  const [modelId, setModelId] = useState(garage.car?.model.id ?? "");
  const brand = brands.find((b) => b.id === brandId);
  const count = modelId ? (fitCounts[modelId] ?? 0) : null;
  const t = tones[tone];
  const selectClass = cn(selectBase, t.select);
  const style = { backgroundImage: chevron(t.stroke), backgroundPosition: "right 12px center", backgroundSize: 16, backgroundRepeat: "no-repeat" };

  return (
    <form
      className={cn("grid gap-2.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (!modelId) return;
        garage.save(modelId);
        onDone?.();
        router.push(`/shop?model=${modelId}`);
      }}
    >
      <select
        aria-label="Make"
        value={brandId}
        onChange={(e) => {
          setBrandId(e.target.value);
          setModelId("");
        }}
        className={selectClass}
        style={style}
      >
        <option value="">Select make</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <select aria-label="Model" value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brand} className={selectClass} style={style}>
        <option value="">{brand ? "Select model" : "Choose a make first"}</option>
        {brand?.models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="xl" className="col-span-full mt-1 w-full" disabled={!modelId}>
        {count === null ? "Show matching parts" : `Show ${count} matching parts`}
        <ArrowRight />
      </Button>
    </form>
  );
}
