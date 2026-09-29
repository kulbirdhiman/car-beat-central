"use client";

import { ArrowRight, CarFront, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CAR_BRANDS, CATEGORY_LABELS, formatPrice } from "@/lib/data";
import { findCar, readGarage } from "@/lib/garage";
import type { Product } from "@/lib/types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function SearchDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Client-only, so the saved car can seed the vehicle filter directly.
  const [modelId, setModelId] = useState<string | null>(() => readGarage());
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const car = findCar(modelId);

  // Search the catalogue API, debounced, cancelling stale requests.
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "8" });
    if (query.trim()) params.set("q", query.trim());
    if (modelId) params.set("model", modelId);
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?${params}`, { signal: controller.signal });
        const data = (await res.json()) as { products: Product[] };
        setResults(data.products);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, modelId]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const shopHref = `/shop?${new URLSearchParams({ ...(query.trim() && { q: query.trim() }), ...(modelId && { model: modelId }) })}`;
  const q = query.trim().toLowerCase();
  const vehicles = CAR_BRANDS.flatMap((b) => b.models.map((m) => ({ brand: b, model: m }))).filter(
    ({ brand, model }) => !q || `${brand.name} ${model.name}`.toLowerCase().includes(q),
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search CarBeat" description="Search products or pick your vehicle" className="sm:max-w-xl">
      {/* Results come from the server, so cmdk's own filtering is off. */}
      <Command shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search stereos, dash cams, or your car model…" />
        {car && (
          <div className="flex items-center gap-2 border-b px-3 py-2 text-xs">
            <CarFront className="size-4 text-primary" />
            Showing parts for <span className="font-medium">{car.brand.name} {car.model.name}</span>
            <button type="button" onClick={() => setModelId(null)} className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-muted">
              <X className="size-3" /> Clear
            </button>
          </div>
        )}
        <CommandList className="max-h-[60vh]">
          {loading && results === null ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          ) : (
            <>
              <CommandEmpty>No matching parts. Try a different word or vehicle.</CommandEmpty>
              {results && results.length > 0 && (
                <CommandGroup heading={car ? "Parts that fit" : "Products"}>
                  {results.map((p) => (
                    <CommandItem key={p.id} value={p.id} onSelect={() => go(`/products/${p.slug}`)} className="gap-3 py-2">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[p.category]}</span>
                      </span>
                      <span className="font-semibold">{formatPrice(p.deal?.price ?? p.price)}</span>
                    </CommandItem>
                  ))}
                  <CommandItem value="__all" onSelect={() => go(shopHref)} className="justify-center text-primary">
                    See all results <ArrowRight />
                  </CommandItem>
                </CommandGroup>
              )}
              {vehicles.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Filter by vehicle">
                    {vehicles.slice(0, q ? 8 : 20).map(({ brand, model }) => (
                      <CommandItem key={model.id} value={`car-${model.id}`} onSelect={() => setModelId(model.id)}>
                        <CarFront />
                        {brand.name} {model.name}
                        {model.id === modelId && <span className="ml-auto text-xs text-primary">Selected</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
