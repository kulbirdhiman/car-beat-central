import type { Metadata } from "next";
import { Check, RotateCcw, ShieldCheck, Star, Truck, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProductCard } from "@/components/product/ProductCard";
import { CAR_BRANDS, CATEGORY_LABELS, discountPercent, formatPrice } from "@/lib/data";
import { getProductBySlug, getRelated, listProducts } from "@/lib/server/queries";
import { BuyBox } from "./BuyBox";
import { FitmentCheck } from "./FitmentCheck";

export function generateStaticParams() {
  return listProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = getProductBySlug((await props.params).slug);
  return product ? { title: `${product.name} · CarBeat`, description: product.description } : {};
}

const PERKS = [
  { icon: Truck, label: "Free shipping over $99" },
  { icon: RotateCcw, label: "30-day change-of-mind returns" },
  { icon: ShieldCheck, label: "Fitment guarantee" },
  { icon: Wrench, label: "Pro fitting available" },
];

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const product = getProductBySlug((await props.params).slug);
  if (!product) notFound();

  const price = product.deal?.price ?? product.price;
  const fitsNames =
    product.fits === "universal"
      ? null
      : CAR_BRANDS.flatMap((b) => b.models.filter((m) => (product.fits as string[]).includes(m.id)).map((m) => `${b.name} ${m.name}`));

  return (
    <PageShell
      crumbs={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: CATEGORY_LABELS[product.category], href: `/shop?category=${product.category}` },
        { label: product.name },
      ]}
    >
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="relative aspect-[4/3] overflow-clip rounded-2xl bg-muted lg:sticky lg:top-28 lg:self-start">
          <Image src={product.image} alt={product.name} fill preload sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover animate-in fade-in zoom-in-105 duration-700" />
          <div className="absolute left-4 top-4 flex gap-2">
            {product.deal && <span className="label-mono rounded-sm bg-destructive px-2 py-1 text-white">Today&apos;s deal</span>}
            {product.badge && <span className="label-mono rounded-sm bg-background/90 px-2 py-1 text-foreground backdrop-blur">{product.badge}</span>}
          </div>
        </div>

        <div>
          <p className="label-mono text-muted-foreground">
            {product.brand} <span className="text-foreground/25">/</span> {CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] sm:text-5xl">{product.name}</h1>
          <a href="#details" className="mt-4 inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`size-4 ${i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
            ))}
            <span className="ml-1 font-medium">{product.rating}</span>
            <span className="text-muted-foreground underline decoration-foreground/20 underline-offset-4">{product.reviews.toLocaleString("en-AU")} reviews</span>
          </a>

          <div className="mt-8 border-y py-6">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="font-display text-5xl font-bold leading-none tabular-nums">{formatPrice(price)}</p>
              {price < product.rrp && (
                <>
                  <p className="pb-1 text-muted-foreground">
                    RRP <span className="line-through">{formatPrice(product.rrp)}</span>
                  </p>
                  <span className="mb-1 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-foreground">
                    Save {discountPercent(price, product.rrp)}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Includes GST. Free shipping on orders over $99.</p>

            <FitmentCheck fits={product.fits} />

            <BuyBox productId={product.id} name={product.name} />
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border text-sm ring-1 ring-border">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 bg-card p-3.5 text-muted-foreground">
                <Icon className="size-4 shrink-0 text-primary" /> {label}
              </li>
            ))}
          </ul>

          <section id="details" className="mt-12 scroll-mt-28">
            <h2 className="label-mono border-t border-foreground/15 pt-4 text-muted-foreground">About this product</h2>
            <p className="mt-4 max-w-prose leading-relaxed">{product.description}</p>
            <ul className="mt-6 grid gap-3">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[15px]">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <h3 className="label-mono mt-10 border-t border-foreground/15 pt-4 text-muted-foreground">Fits</h3>
            {fitsNames ? (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {fitsNames.map((n) => (
                  <li key={n} className="rounded-md bg-muted px-2.5 py-1 text-sm">
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Universal fit: works with most vehicles.</p>
            )}
          </section>
        </div>
      </div>

      <section className="mt-28">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-t border-foreground/15 pt-4">
          <div>
            <p className="label-mono text-muted-foreground">Related</p>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">You might also like</h2>
          </div>
          <Link href={`/shop?category=${product.category}`} className="group text-sm text-muted-foreground transition-colors hover:text-foreground">
            More {CATEGORY_LABELS[product.category].toLowerCase()} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
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
