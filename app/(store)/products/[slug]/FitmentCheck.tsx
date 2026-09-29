"use client";

import { CarFront, CircleAlert, CircleCheck } from "lucide-react";
import Link from "next/link";
import { productFitsModel } from "@/lib/data";
import { useGarage } from "@/lib/garage";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Tells the shopper whether this product fits the car saved in their garage. */
export function FitmentCheck({ fits }: { fits: Product["fits"] }) {
  const { car } = useGarage();

  if (!car) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
        <CarFront className="size-5 shrink-0 text-muted-foreground" />
        <span>
          {fits === "universal" ? "Universal fit." : "Model-specific part."}{" "}
          <Link href="/#garage" className="font-medium text-primary underline-offset-4 hover:underline">
            Add your car
          </Link>{" "}
          to check it fits.
        </span>
      </div>
    );
  }

  const ok = productFitsModel({ fits }, car.model.id);
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <div
      className={cn(
        "mt-6 flex items-center gap-3 rounded-xl p-4 text-sm animate-in fade-in",
        ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="text-foreground">
        {ok ? (
          <>
            <strong>Fits your {car.brand.name} {car.model.name}.</strong> Guaranteed, or we pay return postage.
          </>
        ) : (
          <>
            <strong>Doesn&apos;t fit your {car.brand.name} {car.model.name}.</strong>{" "}
            <Link href={`/shop?model=${car.model.id}`} className="underline underline-offset-4">
              See parts that do
            </Link>
          </>
        )}
      </span>
    </div>
  );
}
