"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { AdminProduct, Department, VehicleMake } from "@/lib/admin/mock-data";
import { formatPrice } from "@/lib/data";

function toggle(set: Set<string>, ids: string[], on: boolean) {
  const next = new Set(set);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return next;
}

/** Vehicle models grouped under their make; ticking a make ticks all its models. */
export function ModelPicker({ makes, value, onChange }: { makes: VehicleMake[]; value: Set<string>; onChange: (next: Set<string>) => void }) {
  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
      {makes.map((make) => {
        const ids = make.models.map((m) => m.id);
        const picked = ids.filter((id) => value.has(id)).length;
        return (
          <div key={make.id}>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={picked === 0 ? false : picked === ids.length ? true : "indeterminate"}
                onCheckedChange={(v) => onChange(toggle(value, ids, v === true))}
                disabled={ids.length === 0}
              />
              {make.name}
              <span className="text-xs font-normal text-muted-foreground">
                {picked}/{ids.length}
              </span>
            </label>
            <div className="mt-1.5 ml-6 flex flex-col gap-1.5">
              {make.models.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={value.has(m.id)} onCheckedChange={(v) => onChange(toggle(value, [m.id], v === true))} />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DepartmentPicker({ departments, value, onChange }: { departments: Department[]; value: Set<string>; onChange: (next: Set<string>) => void }) {
  return (
    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
      {departments.map((d) => (
        <label key={d.id} className="flex items-center gap-2 text-sm">
          <Checkbox checked={value.has(d.id)} onCheckedChange={(v) => onChange(toggle(value, [d.id], v === true))} />
          {d.name}
        </label>
      ))}
    </div>
  );
}

/** Searchable product checklist; ticked products stay listed first. */
export function ProductPicker({ products, value, onChange }: { products: AdminProduct[]; value: Set<string>; onChange: (next: Set<string>) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = products
    .filter((p) => value.has(p.id) || !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    .sort((a, b) => Number(value.has(b.id)) - Number(value.has(a.id)));

  return (
    <div className="rounded-lg border">
      <div className="relative border-b p-2">
        <Search className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="pl-8" aria-label="Search products" />
      </div>
      <div className="max-h-56 overflow-y-auto p-2">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No products match.</p>
        ) : (
          rows.map((p) => (
            <label key={p.id} className="flex items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-muted">
              <Checkbox checked={value.has(p.id)} onCheckedChange={(v) => onChange(toggle(value, [p.id], v === true))} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="size-8 shrink-0 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{formatPrice(p.price)}</span>
            </label>
          ))
        )}
      </div>
      <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">{value.size} selected</p>
    </div>
  );
}
