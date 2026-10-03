"use client";

import { CarFront, CircleCheck, Globe } from "lucide-react";
import { useGarage } from "@/lib/garage";
import { cn } from "@/lib/utils";

type Group = { brand: string; models: { id: string; name: string }[] };

/** Every vehicle this part fits, grouped by make, with the shopper's saved car highlighted. */
export function CompatibleVehicles({ groups }: { groups: Group[] | null }) {
  const { car } = useGarage();
  const count = groups?.reduce((n, g) => n + g.models.length, 0) ?? 0;
  const fitsMine = car && (groups === null || groups.some((g) => g.models.some((m) => m.id === car.model.id)));

  return (
    <section aria-labelledby="compat-title" className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="compat-title" className="flex items-center gap-2 font-semibold">
          <CarFront className="size-5 text-primary" /> Compatible vehicles
        </h2>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{groups ? `${count} models` : "Universal"}</span>
      </div>

      {groups === null ? (
        <p className="mt-3 flex items-start gap-2.5 text-sm text-muted-foreground">
          <Globe className="mt-0.5 size-4 shrink-0 text-success" />
          Universal fit. Works with most cars, utes and 4WDs, no vehicle-specific parts needed.
        </p>
      ) : (
        <dl className="mt-4 grid gap-3">
          {groups.map((g) => (
            <div key={g.brand} className="grid grid-cols-[88px_1fr] items-start gap-3">
              <dt className="pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.brand}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {g.models.map((m) => {
                  const mine = car?.model.id === m.id;
                  return (
                    <span
                      key={m.id}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium",
                        mine ? "border-success bg-success/10 text-success" : "bg-background",
                      )}
                    >
                      {mine && <CircleCheck className="size-3.5" />}
                      {m.name}
                    </span>
                  );
                })}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {car && (
        <p className={cn("mt-4 rounded-lg px-3 py-2 text-sm", fitsMine ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
          {fitsMine ? `✓ Fits your ${car.brand.name} ${car.model.name}` : `Not listed for your ${car.brand.name} ${car.model.name}`}
        </p>
      )}
    </section>
  );
}
