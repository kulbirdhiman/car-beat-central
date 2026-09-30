"use client";

import { ArrowRight, CarFront, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAR_BRANDS } from "@/lib/data";
import { useGarage } from "@/lib/garage";

/** `fitCounts`: number of products that fit each model id, computed on the server. */
export function VehicleFinder({ fitCounts }: { fitCounts: Record<string, number> }) {
  const router = useRouter();
  const garage = useGarage();
  const [brandId, setBrandId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const brand = CAR_BRANDS.find((b) => b.id === brandId);
  const count = modelId ? (fitCounts[modelId] ?? 0) : null;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-card text-card-foreground shadow-[0_30px_80px_-20px_oklch(0.1_0.02_50/0.6)] ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <span className="label-mono flex items-center gap-2 text-muted-foreground">
          <CarFront className="size-4 text-primary" /> Vehicle finder
        </span>
        {garage.car && (
          <span className="truncate pl-3 text-xs text-muted-foreground">
            Saved: <span className="font-medium text-foreground">{garage.car.brand.name} {garage.car.model.name}</span>
          </span>
        )}
      </div>

      <div className="p-6">
        <h2 className="font-display text-2xl font-bold leading-tight">Find parts for your car</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Only see parts that fit. Guaranteed.</p>

        <div className="mt-6 grid gap-3">
          <label className="grid gap-1.5">
            <span className="label-mono text-muted-foreground">
              <span className="text-primary">1</span> Make
            </span>
            <Select
              value={brandId}
              onValueChange={(v) => {
                setBrandId(v);
                setModelId("");
              }}
            >
              <SelectTrigger className="h-11! w-full bg-background" aria-label="Make">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                {CAR_BRANDS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5">
            <span className="label-mono text-muted-foreground">
              <span className="text-primary">2</span> Model
            </span>
            <Select value={modelId} onValueChange={setModelId} disabled={!brand}>
              <SelectTrigger className="h-11! w-full bg-background" aria-label="Model">
                <SelectValue placeholder={brand ? "Select model" : "Choose a make first"} />
              </SelectTrigger>
              <SelectContent>
                {brand?.models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button
            size="xl"
            className="group mt-2 w-full"
            disabled={!modelId}
            onClick={() => {
              garage.save(modelId);
              router.push(`/shop?model=${modelId}`);
            }}
          >
            {count === null ? "Show matching parts" : `Show ${count} matching parts`}
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      <p className="flex items-center gap-2 bg-muted px-6 py-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-success" />
        If it doesn&apos;t fit, we pay return postage.
      </p>
    </div>
  );
}
