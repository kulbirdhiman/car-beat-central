import type { Metadata } from "next";
import { LayoutGrid, ShieldCheck, SlidersHorizontal, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CAR_BRANDS, CATEGORY_IMAGES, CATEGORY_LABELS, OFFERS } from "@/lib/data";
import { getCategoryCounts, getDeals, getFitCounts, listProducts, SORTS } from "@/lib/server/queries";
import { parseFilters } from "@/lib/server/validate";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OfferStrip } from "./OfferStrip";
import { SortSelect } from "./SortSelect";
import { VehicleFilter } from "./VehicleFilter";

export const metadata: Metadata = { title: "Shop all parts · CarBeat" };

const PRICES = [
  { cap: null, label: "Any price" },
  { cap: 100, label: "Under $100" },
  { cap: 300, label: "Under $300" },
  { cap: 600, label: "Under $600" },
];

export default async function ShopPage(props: PageProps<"/shop">) {
  const raw = await props.searchParams;
  const params = new URLSearchParams(Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const filters = parseFilters(params);
  const products = listProducts(filters);
  const car = CAR_BRANDS.flatMap((b) => b.models.map((m) => ({ brand: b, model: m }))).find((c) => c.model.id === filters.model);
  const counts = getCategoryCounts();
  const total = Object.values(counts).reduce((n, c) => n + (c ?? 0), 0);

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
    <div className="space-y-4">
      <VehicleFilter key={filters.model ?? "none"} modelId={filters.model} fitCounts={getFitCounts()} />

      <FilterCard title="Categories">
        <CategoryLink href={hrefWith({ category: null })} active={!filters.category} label="All categories" count={total}>
          <LayoutGrid className="size-4" />
        </CategoryLink>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <CategoryLink key={c} href={hrefWith({ category: c })} active={filters.category === c} label={CATEGORY_LABELS[c]} count={counts[c] ?? 0}>
            <Image src={CATEGORY_IMAGES[c]} alt="" fill sizes="32px" className="object-cover" />
          </CategoryLink>
        ))}
      </FilterCard>

      <FilterCard title="Price">
        {PRICES.map((p) => (
          <OptionLink key={p.label} href={hrefWith({ maxPrice: p.cap === null ? null : String(p.cap) })} active={(filters.maxPrice ?? null) === p.cap}>
            {p.label}
          </OptionLink>
        ))}
      </FilterCard>

      <FilterCard title="Offers">
        <OptionLink href={hrefWith({ sale: filters.onSale ? null : "1" })} active={!!filters.onSale} checkbox>
          <Zap className="size-3.5 fill-primary text-primary" /> Today&apos;s deals only
        </OptionLink>
      </FilterCard>

      <Link href="/returns#fitment" className="flex gap-3 rounded-2xl border bg-card p-4 text-sm transition-colors hover:border-foreground/20">
        <ShieldCheck className="size-5 shrink-0 text-primary" />
        <span>
          <span className="block font-semibold">Fitment guarantee</span>
          <span className="text-muted-foreground">Doesn&apos;t fit your car? We pay return postage.</span>
        </span>
      </Link>
    </div>
  );

  return (
    <PageShell crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} className="pt-6">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="no-scrollbar hidden lg:sticky lg:top-28 lg:block lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pb-4">{filterPanel}</aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <h1 className="font-display text-3xl font-bold leading-[1.05] sm:text-4xl">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? "product" : "products"} · All prices include GST
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-10 bg-card lg:hidden">
                    <SlidersHorizontal /> Filters {active.length > 0 && <Badge className="ml-1">{active.length}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[340px] overflow-y-auto bg-background">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-8">{filterPanel}</div>
                </SheetContent>
              </Sheet>
              <SortSelect value={filters.sort ?? "popular"} options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))} />
            </div>
          </div>

          {active.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {active.map((f) => (
                <Badge key={f.key} asChild variant="outline" className="h-8 gap-1.5 rounded-full bg-card px-3 text-sm hover:border-foreground/30">
                  <Link href={hrefWith({ [f.key]: null })} scroll={false} aria-label={`Remove filter ${f.label}`}>
                    {f.label} <X className="size-3.5!" />
                  </Link>
                </Badge>
              ))}
              {active.length > 1 && (
                <Link href="/shop" className="px-2 text-sm text-primary underline-offset-4 hover:underline">
                  Clear all
                </Link>
              )}
            </div>
          )}

          <div className="mt-5">
            <OfferStrip offers={OFFERS} dealCount={getDeals().length} />
          </div>

          <div className="mt-6">
            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-foreground/20 bg-card px-6 py-16 text-center">
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
      </div>
    </PageShell>
  );
}

function FilterCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="grid gap-0.5">{children}</div>
    </section>
  );
}

function CategoryLink({ href, active, label, count, children }: { href: string; active: boolean; label: string; count: number; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn("flex items-center gap-3 rounded-lg p-1.5 pr-2.5 text-sm transition-colors", active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted")}
    >
      <span className={cn("relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-md", active ? "bg-primary/15" : "bg-muted")}>{children}</span>
      <span className="flex-1 truncate">{label}</span>
      <span className={cn("text-xs", active ? "text-primary" : "text-muted-foreground")}>{count}</span>
    </Link>
  );
}

/** Single-choice option with a radio dot, or a checkbox when `checkbox` is set. */
function OptionLink({ href, active, checkbox, children }: { href: string; active: boolean; checkbox?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn("flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted", active && "font-semibold")}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center border-2 transition-colors",
          checkbox ? "rounded" : "rounded-full",
          active ? "border-primary bg-primary" : "border-input bg-background",
        )}
      >
        {active && <span className={cn("bg-white", checkbox ? "size-1.5 rounded-[1px]" : "size-1.5 rounded-full")} />}
      </span>
      <span className="flex items-center gap-1.5">{children}</span>
    </Link>
  );
}
