import type { Metadata } from "next";
import { ArrowRight, Check, MessageSquareText, RotateCcw, ShieldCheck, Star, Truck, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProductCard } from "@/components/product/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_GALLERY, CATEGORY_LABELS, discountPercent, findDepartment, formatPrice } from "@/lib/data";
import { getCarBrands, getProductBySlug, getRelated, getStoreDepartments, listProducts } from "@/lib/server/queries";
import { listReviews } from "@/lib/server/reviews";
import { getSpecs } from "@/lib/server/specs";
import { cn } from "@/lib/utils";
import { BuyBox } from "./BuyBox";
import { CompatibleVehicles } from "./CompatibleVehicles";
import { FitmentCheck } from "./FitmentCheck";
import { ProductGallery } from "./ProductGallery";
import { ReviewForm } from "./ReviewForm";

export function generateStaticParams() {
  return listProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = getProductBySlug((await props.params).slug);
  return product ? { title: `${product.name} · CarBeat`, description: product.description } : {};
}

const PERKS = [
  { icon: Truck, title: "Free shipping", body: "On orders over $99" },
  { icon: RotateCcw, title: "30-day returns", body: "Change of mind is fine" },
  { icon: ShieldCheck, title: "Fitment guarantee", body: "Or we pay return postage" },
  { icon: Wrench, title: "Pro fitting", body: "In every capital city" },
];

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const product = getProductBySlug((await props.params).slug);
  if (!product) notFound();

  const price = product.deal?.price ?? product.price;
  const off = discountPercent(price, product.rrp);
  const images = [...new Set([product.image, ...CATEGORY_GALLERY[product.category]])].slice(0, 5);
  const fits = product.fits;
  const groups =
    fits === "universal"
      ? null
      : getCarBrands().map((b) => ({ brand: b.name, models: b.models.filter((m) => fits.includes(m.id)) })).filter((g) => g.models.length > 0);
  const reviews = listReviews(product.id);
  // Breadcrumbs follow the product's department; products without one fall back to their type.
  const dept = product.departmentId ? findDepartment(getStoreDepartments(), (d) => d.id === product.departmentId) : null;
  const section = dept
    ? { label: dept.department.name, href: `/shop?dept=${dept.department.slug}` }
    : { label: CATEGORY_LABELS[product.category], href: `/shop?category=${product.category}` };
  const flags = [
    ...(product.deal ? [{ label: "Today's deal", tone: "deal" as const }] : []),
    ...(product.badge ? [{ label: product.badge, tone: "badge" as const }] : []),
  ];

  return (
    <PageShell
      className="pt-6"
      crumbs={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        ...(dept?.parent ? [{ label: dept.parent.name, href: `/shop?dept=${dept.parent.slug}` }] : []),
        section,
        { label: product.name },
      ]}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* Gallery and fitment stay in view while the details scroll. */}
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={images} name={product.name} flags={flags} />
          <CompatibleVehicles groups={groups} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-foreground">{product.brand}</span>
            <Link href={section.href} className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              {section.label}
            </Link>
          </div>

          <h1 className="mt-4 border-l-4 border-primary pl-4 font-display text-3xl font-bold leading-[1.05] sm:text-[2.75rem]">{product.name}</h1>

          <a href="#reviews" className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm hover:opacity-80">
            <span className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("size-4", i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
              ))}
            </span>
            <span className="font-semibold">{product.rating}</span>
            <span className="text-muted-foreground underline decoration-foreground/20 underline-offset-4">{product.reviews.toLocaleString("en-AU")} ratings</span>
          </a>

          <p className="mt-4 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className={cn("font-display text-5xl font-bold leading-none tabular-nums", off > 0 && "text-primary")}>{formatPrice(price)}</p>
              {off > 0 && (
                <>
                  <p className="pb-1 text-muted-foreground">
                    RRP <span className="line-through">{formatPrice(product.rrp)}</span>
                  </p>
                  <span className="mb-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    Save {formatPrice(product.rrp - price)} ({off}%)
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Includes GST. Free shipping on orders over $99.</p>

            {product.deal && (
              <div className="mt-4">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-primary">Today&apos;s deal ends at midnight</span>
                  <span className="font-mono text-muted-foreground">{product.deal.claimed}% claimed</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${product.deal.claimed}%` }} />
                </div>
              </div>
            )}

            <FitmentCheck fits={product.fits} />
            <BuyBox productId={product.id} name={product.name} image={product.image} price={price} stock={product.stock} />
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2">
            {PERKS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 text-sm leading-tight">
                  <span className="block font-semibold">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>

          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-4">
              <h2 className="font-semibold">Key features</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 rounded-xl bg-card p-3 text-sm ring-1 ring-border">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success/15">
                      <Check className="size-3 text-success" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="specs" className="pt-4">
              <dl className="overflow-hidden rounded-xl border bg-card text-sm">
                {getSpecs(product).map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[40%_1fr] gap-4 px-4 py-3 even:bg-secondary/60">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>
            <TabsContent value="delivery" className="space-y-3 pt-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Free shipping</strong> Australia-wide on orders over $99. Orders are dispatched with tracking.
              </p>
              <p>
                <strong className="text-foreground">30-day returns</strong> on unused items, and our fitment guarantee covers return postage if it doesn&apos;t fit your car.{" "}
                <Link href="/returns" className="text-primary underline-offset-4 hover:underline">
                  Returns policy
                </Link>
              </p>
              <p>
                <strong className="text-foreground">12-month warranty</strong> on every product, plus 2 years on installs by CarBeat fitters.{" "}
                <Link href="/warranty" className="text-primary underline-offset-4 hover:underline">
                  Warranty
                </Link>
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <section id="reviews" className="mt-20 scroll-mt-28">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-14">
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-3xl font-bold">Customer reviews</h2>
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-4">
                <p className="font-display text-6xl font-bold leading-none">{product.rating}</p>
                <div>
                  <span className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn("size-5", i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                    ))}
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">From {product.reviews.toLocaleString("en-AU")} ratings</p>
                </div>
              </div>
              <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">Bought this? Help other drivers by sharing how it fits and performs in your car.</p>
              <div className="mt-4">
                <ReviewForm productId={product.id} slug={product.slug} />
              </div>
            </div>
          </div>

          <div>
            {reviews.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                <MessageSquareText className="size-8 text-muted-foreground" />
                <p className="mt-3 font-display text-xl font-bold">No written reviews yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Be the first to tell other drivers what you think.</p>
              </div>
            ) : (
              <ul className="grid gap-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn("size-4", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </span>
                      <time className="text-xs text-muted-foreground" dateTime={r.createdAt}>
                        {new Date(`${r.createdAt}Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    <p className="mt-3 font-semibold">{r.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="grid size-6 place-items-center rounded-full bg-ink text-[11px] font-bold uppercase text-ink-foreground">{r.name.charAt(0)}</span>
                      <span className="font-semibold">{r.name}</span>
                      {r.vehicle && <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{r.vehicle}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold">You might also like</h2>
          <Link href={section.href} className="group flex items-center gap-1 text-sm font-semibold text-primary">
            More {section.label.toLowerCase()} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {getRelated(product).map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
