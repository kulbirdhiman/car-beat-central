"use client";

import { ArrowRight, CarFront } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full gap-5 bg-card/95 py-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <CardHeader className="px-6">
        <CardTitle className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight">
          <CarFront className="size-5 text-primary" /> Find parts for your car
        </CardTitle>
        <CardDescription>
          {garage.car ? (
            <>
              Your garage: <span className="font-medium text-foreground">{garage.car.brand.name} {garage.car.model.name}</span>
            </>
          ) : (
            "Only see parts that fit. Guaranteed, or we'll pay return shipping."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 px-6">
        <Select
          value={brandId}
          onValueChange={(v) => {
            setBrandId(v);
            setModelId("");
          }}
        >
          <SelectTrigger className="h-11! w-full" aria-label="Make">
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
        <Select value={modelId} onValueChange={setModelId} disabled={!brand}>
          <SelectTrigger className="h-11! w-full" aria-label="Model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {brand?.models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="lg"
          className="group h-11 text-sm"
          disabled={!modelId}
          onClick={() => {
            garage.save(modelId);
            router.push(`/shop?model=${modelId}`);
          }}
        >
          {count === null ? "Show matching parts" : `Show ${count} matching parts`}
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
