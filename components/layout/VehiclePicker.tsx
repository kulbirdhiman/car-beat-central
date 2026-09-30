"use client";

import { ArrowRight, CarFront, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CAR_BRANDS } from "@/lib/data";
import { useGarage } from "@/lib/garage";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full appearance-none rounded-lg border bg-background bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23888' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pl-3 pr-9 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50";

/**
 * Compact "your vehicle" control for the header. Shows the saved car, or a prompt to pick one;
 * opens a small make/model form. `fitCounts`: products that fit each model id, from the server.
 */
export function VehiclePicker({ fitCounts, className }: { fitCounts: Record<string, number>; className?: string }) {
  const router = useRouter();
  const garage = useGarage();
  const [open, setOpen] = useState(false);
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const brand = CAR_BRANDS.find((b) => b.id === brandId);
  const count = modelId ? (fitCounts[modelId] ?? 0) : null;
  const car = garage.car;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Start the form on the saved car, so "change" is one tap away from the current value.
        if (next) {
          setBrandId(car?.brand.id ?? "");
          setModelId(car?.model.id ?? "");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-3 text-sm transition-colors",
            car ? "bg-white/10 text-white hover:bg-white/15" : "bg-primary/15 text-white ring-1 ring-primary/50 hover:bg-primary/25",
            className,
          )}
        >
          <CarFront className="size-4 text-primary" />
          {car ? (
            <span className="truncate">
              <span className="text-white/60">My car:</span> {car.brand.name} {car.model.name}
            </span>
          ) : (
            <span className="truncate font-medium">Select your vehicle</span>
          )}
          <ChevronDown className="ml-auto size-4 shrink-0 text-white/60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(340px,calc(100vw-2rem))] p-5">
        <p className="font-display text-lg font-bold">Find parts for your car</p>
        <p className="mt-1 text-sm text-muted-foreground">We&apos;ll only show parts that fit. Guaranteed.</p>

        <form
          className="mt-4 grid gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!modelId) return;
            garage.save(modelId);
            setOpen(false);
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
          >
            <option value="">Select make</option>
            {CAR_BRANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select aria-label="Model" value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brand} className={selectClass}>
            <option value="">{brand ? "Select model" : "Choose a make first"}</option>
            {brand?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="xl" className="mt-1 w-full" disabled={!modelId}>
            {count === null ? "Show matching parts" : `Show ${count} matching parts`}
            <ArrowRight />
          </Button>
        </form>

        {car && (
          <button
            type="button"
            onClick={() => {
              garage.clear();
              setBrandId("");
              setModelId("");
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Forget my {car.model.name}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
