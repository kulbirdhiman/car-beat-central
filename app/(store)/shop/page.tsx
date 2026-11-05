import type { Metadata } from "next";
import { ArrowRight, ChevronDown, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, findDepartment } from "@/lib/data";
import { getDeals, getLiveOffers, SORTS } from "@/lib/server/queries";
import { getStoreChromeData } from "@/lib/server/home-data";
import { getBrowseFitCounts, getBrowseProducts } from "@/lib/server/browse-data";
import { parseFilters } from "@/lib/server/validate";
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
const PAGE_SIZE = 12;

export default async function ShopPage(props: PageProps<"/shop">) {
  const raw = await props.searchParams;
  const params = new URLSearchParams(Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const filters = await parseFilters(params);
  const [products, { brands, departments, total }, fitCounts, offers, deals] = await Promise.all([
    getBrowseProducts(filters),
    getStoreChromeData(),
    getBrowseFitCounts(filters),
    getLiveOffers(),
    getDeals(),
  ]);
  const carBase = brands.flatMap((b) => b.models.map((m) => ({ brand: b, model: m }))).find((c) => c.model.id === filters.model);
  const car = carBase && { ...carBase, subModel: carBase.model.subModels?.find((s) => s.id === filters.subModel) };
  const dept = filters.dept ? findDepartment(departments, (d) => d.slug === filters.dept) : null;
  // The top-level department whose sub-departments are shown in the sidebar.
  const openDept = dept?.parent ?? dept?.department;
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const requestedPage = Number(params.get("page"));
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(pageCount, requestedPage)) : 1;
  const visibleProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** Builds a /shop URL from the current filters with some keys changed (null removes). */
  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    if (changes.model === null) {
      next.delete("submodel");
      next.delete("year");
    }
    const qs = next.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const title = dept
    ? dept.department.name
    : filters.category
      ? CATEGORY_LABELS[filters.category]
      : car
        ? `Parts for your ${car.subModel?.name ?? car.model.name}`
        : "All parts";

  const active = [
    filters.q && { label: `“${filters.q}”`, key: "q" },
    filters.category && { label: CATEGORY_LABELS[filters.category], key: "category" },
    filters.dept && { label: dept?.department.name ?? filters.dept, key: "dept" },
    car && { label: `${car.brand.name} ${car.subModel?.name ?? car.model.name}`, key: "model" },
    filters.year && { label: `Year: ${filters.year}`, key: "year" },
    filters.maxPrice && { label: `Under $${filters.maxPrice}`, key: "maxPrice" },
  ].filter(Boolean) as { label: string; key: string }[];

  return (
    <PageShell crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} className="pt-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b pb-6 sm:mb-9">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">The CarBeat collection</p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Find your next upgrade. Browse by category or match parts to your car.</p>
        </div>
        <span className="rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground">{total} parts to explore</span>
      </div>

      <div className="grid gap-7 xl:grid-cols-[230px_minmax(0,1fr)] xl:gap-9">
        <aside aria-label="Product categories" className="min-w-0 xl:sticky xl:top-32 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Categories</h2>
            <LayoutGrid className="size-4 text-muted-foreground" />
          </div>
          <nav aria-label="Browse categories" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 xl:mx-0 xl:grid xl:overflow-visible xl:rounded-2xl xl:border xl:bg-card xl:p-2">
            <Link href={hrefWith({ dept: null, category: null })} aria-current={!filters.dept && !filters.category ? "page" : undefined} className={cn("flex shrink-0 items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors xl:border-0", !filters.dept && !filters.category ? "border-primary bg-primary/5 font-semibold text-primary" : "bg-card hover:bg-muted")}>
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted"><LayoutGrid className="size-4" /></span>
              <span className="flex-1 whitespace-nowrap">All categories</span><span className="text-xs text-muted-foreground">{total}</span>
            </Link>
            {departments.map((department) => (
              <Link key={department.id} href={hrefWith({ dept: department.slug, category: null })} aria-current={openDept?.id === department.id ? "page" : undefined} className={cn("flex shrink-0 items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors xl:border-0", openDept?.id === department.id ? "border-primary bg-primary/5 font-semibold text-primary" : "bg-card hover:bg-muted")}>
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={department.image} alt="" fill sizes="40px" className="object-cover" /></span>
                <span className="flex-1 whitespace-nowrap xl:whitespace-normal">{department.name}</span><span className="text-xs text-muted-foreground">{department.count}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <VehicleFilter key={`${filters.model ?? "none"}:${filters.subModel ?? "none"}:${filters.year ?? "all"}`} modelId={filters.model} subModelId={filters.subModel} year={filters.year} fitCounts={fitCounts} />

          {openDept && openDept.children.length > 0 && (
            <nav aria-label="Subcategories" className="mt-5 flex flex-wrap gap-2">
              {openDept.children.map((child) => <Link key={child.id} href={hrefWith({ dept: child.slug, category: null })} aria-current={filters.dept === child.slug ? "page" : undefined} className={cn("rounded-full border px-4 py-2 text-sm", filters.dept === child.slug ? "border-primary bg-primary/5 font-semibold text-primary" : "bg-card hover:border-primary")}>{child.name} <span className="ml-1 text-xs text-muted-foreground">{child.count}</span></Link>)}
            </nav>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <p className="text-sm"><span className="font-semibold">{products.length} {products.length === 1 ? "product" : "products"}</span><span className="mt-1 block text-xs text-muted-foreground sm:ml-2 sm:mt-0 sm:inline">All prices include GST</span></p>
            <div className="flex flex-wrap items-center gap-2">
              <details className="group relative">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium [&::-webkit-details-marker]:hidden"><SlidersHorizontal className="size-4" /> Price <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" /></summary>
                <nav aria-label="Price range" className="absolute right-0 z-20 mt-2 w-44 rounded-xl border bg-card p-1.5 shadow-lg">
                  {PRICES.map((price) => <Link key={price.label} href={hrefWith({ maxPrice: price.cap === null ? null : String(price.cap) })} aria-current={(filters.maxPrice ?? null) === price.cap ? "page" : undefined} className={cn("block rounded-lg px-3 py-2.5 text-sm hover:bg-muted", (filters.maxPrice ?? null) === price.cap && "bg-primary/5 font-semibold text-primary")}>{price.label}</Link>)}
                </nav>
              </details>
              <SortSelect value={filters.sort ?? "popular"} options={Object.entries(SORTS).map(([value, sort]) => ({ value, label: sort.label }))} />
            </div>
          </div>

          {active.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {active.map((filter) => <Badge key={filter.key} asChild variant="outline" className="h-auto min-h-9 max-w-full gap-2 rounded-full bg-card px-3 py-2 text-xs"><Link href={hrefWith({ [filter.key]: null })} scroll={false} aria-label={`Remove filter ${filter.label}`}><span className="truncate">{filter.label}</span><X className="size-3.5 shrink-0" /></Link></Badge>)}
              <Link href="/shop" className="px-2 py-2 text-xs font-semibold text-primary hover:underline">Clear all</Link>
            </div>
          )}

          {(offers.length > 0 || deals.length > 0) && <div className="mt-5"><OfferStrip offers={offers} dealCount={deals.length} /></div>}
          <div className="mt-5">
            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                <LayoutGrid className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 font-display text-2xl font-bold">No parts match those filters</h2>
                <p className="mt-2 text-sm text-muted-foreground">Try another category or remove a filter.</p>
                <Button asChild className="mt-6"><Link href="/shop">Browse all parts <ArrowRight /></Link></Button>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleProducts.map((product) => <li key={product.id}><ProductCard product={product} sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw" /></li>)}
              </ul>
            )}
          </div>
          {pageCount > 1 && (
            <nav aria-label="Product pages" className="mt-8 flex items-center justify-between gap-3 border-t pt-5 text-sm">
              {page > 1 ? <Link href={hrefWith({ page: String(page - 1) })} className="rounded-lg border bg-card px-4 py-3 font-semibold">Previous</Link> : <span />}
              <span className="text-muted-foreground">Page {page} of {pageCount}</span>
              {page < pageCount ? <Link href={hrefWith({ page: String(page + 1) })} className="rounded-lg border bg-card px-4 py-3 font-semibold">Next</Link> : <span />}
            </nav>
          )}
        </div>
      </div>
    </PageShell>
  );
}
