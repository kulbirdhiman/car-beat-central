import type { Metadata } from "next";
import { CarFront, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CAR_BRANDS, CATEGORY_LABELS } from "@/lib/data";
import { listProducts, SORTS } from "@/lib/server/queries";
import { parseFilters } from "@/lib/server/validate";
import type { Category } from "@/lib/types";
import { SortSelect } from "./SortSelect";

export const metadata: Metadata = { title: "Shop all parts · CarBeat" };

const PRICE_CAPS = [100, 300, 600];

export default async function ShopPage(props: PageProps<"/shop">) {
  const raw = await props.searchParams;
  const params = new URLSearchParams(Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const filters = parseFilters(params);
  const products = listProducts(filters);
  const car = CAR_BRANDS.flatMap((b) => b.models.map((m) => ({ brand: b, model: m }))).find((c) => c.model.id === filters.model);

  /** Builds a /shop URL from the current filters with some keys changed (null removes). */
  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const title = filters.onSale
    ? "Today's deals"
    : filters.category
      ? CATEGORY_LABELS[filters.category]
      : car
        ? `Parts for your ${car.model.name}`
        : "All parts";

  const active = [
    filters.q && { label: `“${filters.q}”`, key: "q" },
    filters.category && { label: CATEGORY_LABELS[filters.category], key: "category" },
    car && { label: `${car.brand.name} ${car.model.name}`, key: "model" },
    filters.maxPrice && { label: `Under $${filters.maxPrice}`, key: "maxPrice" },
    filters.onSale && { label: "On sale", key: "sale" },
  ].filter(Boolean) as { label: string; key: string }[];

  const filterPanel = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        <FilterLink href={hrefWith({ category: null })} active={!filters.category}>
          All categories
        </FilterLink>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <FilterLink key={c} href={hrefWith({ category: c })} active={filters.category === c}>
            {CATEGORY_LABELS[c]}
          </FilterLink>
        ))}
      </FilterGroup>

      <FilterGroup title="Your vehicle">
        <form action="/shop" className="space-y-2">
          {[...params.entries()]
            .filter(([k]) => k !== "model")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <select
            name="model"
            defaultValue={filters.model ?? ""}
            aria-label="Vehicle"
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Any vehicle</option>
            {CAR_BRANDS.map((b) => (
              <optgroup key={b.id} label={b.name}>
                {b.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {b.name} {m.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Button type="submit" variant="ink" className="h-10 w-full">
            <CarFront /> Show parts that fit
          </Button>
        </form>
      </FilterGroup>

      <FilterGroup title="Price">
        <FilterLink href={hrefWith({ maxPrice: null })} active={!filters.maxPrice}>
          Any price
        </FilterLink>
        {PRICE_CAPS.map((cap) => (
          <FilterLink key={cap} href={hrefWith({ maxPrice: String(cap) })} active={filters.maxPrice === cap}>
            Under ${cap}
          </FilterLink>
        ))}
      </FilterGroup>

      <FilterGroup title="Offers">
        <FilterLink href={hrefWith({ sale: filters.onSale ? null : "1" })} active={!!filters.onSale}>
          Today&apos;s deals only
        </FilterLink>
      </FilterGroup>
    </div>
  );

  return (
    <PageShell crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} title={title} description={`${products.length} ${products.length === 1 ? "product" : "products"}. All prices include GST.`}>
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-10 bg-card lg:hidden">
                  <SlidersHorizontal /> Filters {active.length > 0 && <Badge className="ml-1">{active.length}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">{filterPanel}</div>
              </SheetContent>
            </Sheet>

            {active.map((f) => (
              <Badge key={f.key} asChild variant="outline" className="h-8 gap-1.5 rounded-md bg-card px-3 text-sm hover:border-foreground/30">
                <Link href={hrefWith({ [f.key]: null })} aria-label={`Remove filter ${f.label}`}>
                  {f.label} <X className="size-3.5!" />
                </Link>
              </Badge>
            ))}
            {active.length > 1 && (
              <Link href="/shop" className="px-2 text-sm text-muted-foreground underline-offset-4 hover:underline">
                Clear all
              </Link>
            )}

            <div className="ml-auto">
              <SortSelect value={filters.sort ?? "popular"} options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))} />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-foreground/20 px-6 py-16 text-center">
              <p className="label-mono text-muted-foreground">0 results</p>
              <p className="mt-3 font-display text-3xl font-bold">No parts match those filters</p>
              <p className="mt-2 text-muted-foreground">Try removing a filter or searching for something broader.</p>
              <Button asChild size="lg" className="mt-6 h-10 px-4">
                <Link href="/shop">Show all parts</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {products.map((p, i) => (
                <li key={p.id} className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  <ProductCard product={p} sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 35vw, 50vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="label-mono mb-3 border-t border-foreground/15 pt-3 text-muted-foreground">{title}</h2>
      <div className="grid gap-0.5">{children}</div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`relative rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-foreground/[0.07] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      {children}
    </Link>
  );
}
