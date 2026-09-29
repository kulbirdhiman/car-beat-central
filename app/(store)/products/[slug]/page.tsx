import type { Metadata } from "next";
import { Check, RotateCcw, ShieldCheck, Star, Truck, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="relative aspect-[4/3] overflow-clip rounded-3xl bg-muted lg:sticky lg:top-28 lg:self-start">
          <Image src={product.image} alt={product.name} fill preload sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover animate-in fade-in zoom-in-105 duration-700" />
          <div className="absolute left-4 top-4 flex gap-2">
            {product.deal && <Badge className="h-7 bg-destructive px-3 text-white">Today&apos;s deal</Badge>}
            {product.badge && <Badge className="h-7 bg-background/90 px-3 text-foreground">{product.badge}</Badge>}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {product.brand} · {CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight">{product.name}</h1>
          <a href="#details" className="mt-3 inline-flex items-center gap-1.5 text-sm">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`size-4 ${i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
            ))}
            <span className="font-medium">{product.rating}</span>
            <span className="text-muted-foreground">({product.reviews.toLocaleString("en-AU")} reviews)</span>
          </a>

          <div className="mt-6 flex items-end gap-3">
            <p className="font-display text-5xl font-bold">{formatPrice(price)}</p>
            <p className="pb-1.5 text-muted-foreground">
              RRP <span className="line-through">{formatPrice(product.rrp)}</span>
            </p>
            <Badge className="mb-2">Save {discountPercent(price, product.rrp)}%</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Includes GST. Free shipping on orders over $99.</p>

          <FitmentCheck fits={product.fits} />

          <BuyBox productId={product.id} name={product.name} />

          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4 shrink-0 text-primary" /> {label}
              </li>
            ))}
          </ul>

          <Separator className="my-8" />

          <section id="details" className="scroll-mt-28">
            <h2 className="font-display text-2xl font-bold uppercase">About this product</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{product.description}</p>
            <ul className="mt-5 grid gap-2.5">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <h3 className="mt-8 font-display text-xl font-bold uppercase">Fits</h3>
            <p className="mt-2 text-sm text-muted-foreground">{fitsNames ? fitsNames.join(", ") : "Universal fit: works with most vehicles."}</p>
          </section>
        </div>
      </div>

      <section className="mt-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl font-bold uppercase">You might also like</h2>
          <Link href={`/shop?category=${product.category}`} className="text-sm text-muted-foreground hover:text-foreground">
            More {CATEGORY_LABELS[product.category].toLowerCase()} →
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
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
