import { ArrowRight, CarFront, Check, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { discountPercent, formatPrice } from "@/lib/data";
import { getCarBrands } from "@/lib/server/queries";
import { getProductSpecs } from "@/lib/server/specs";
import type { Product } from "@/lib/types";

/** One hero product, sold on its specs: image left, spec tiles, fitment and price right. */
export async function UpgradeSpotlight({ product }: { product: Product }) {
  const price = product.deal?.price ?? product.price;
  const off = discountPercent(price, product.rrp);
  const modelNames = Object.fromEntries((await getCarBrands()).flatMap((b) => b.models.map((m) => [m.id, m.name])));
  const fits = product.fits === "universal" ? [] : product.fits.map((id) => modelNames[id]).filter(Boolean);
  // The product's own spec rows, or its feature list when it has none.
  const specs = getProductSpecs(product).slice(0, 4);
  const highlights = specs.length > 0 ? specs : product.features.slice(0, 4).map((f): [string, string] => ["Feature", f]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <Reveal className="grid overflow-clip rounded-3xl border bg-card lg:grid-cols-2">
        <div className="relative min-h-[320px] bg-muted lg:min-h-full">
          <Image src={product.image} alt={product.name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {product.departmentName && <span className="rounded-md bg-card/95 px-2.5 py-1.5 text-xs font-semibold backdrop-blur">{product.departmentName}</span>}
            {off > 0 && <span className="rounded-md bg-destructive px-2.5 py-1.5 text-xs font-bold text-white">{off}% OFF</span>}
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-xl bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
            <span className="font-display text-3xl font-bold leading-none">{product.rating}</span>
            <span className="text-xs leading-tight text-muted-foreground">
              <span className="flex text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-3 fill-current" />
                ))}
              </span>
              {product.reviews.toLocaleString("en-AU")} driver reviews
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-0.5 w-5 rounded-full bg-primary" /> Featured upgrade · {product.brand}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-[1.05] sm:text-4xl">{product.name}</h2>
          <p className="mt-4 text-muted-foreground">{product.description}</p>

          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {highlights.map(([label, value]) => (
              <li key={value} className="rounded-xl border bg-background p-4">
                <Check className="size-5 text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold leading-snug">{value}</p>
              </li>
            ))}
          </ul>

          {fits.length > 0 && (
            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CarFront className="size-4 text-primary" /> Made to fit {fits.length} models
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {fits.map((name) => (
                  <li key={name} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t pt-6">
            <div>
              <p className="text-xs text-muted-foreground">{product.deal ? "Today\u2019s deal price" : "Price incl. GST"}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-destructive">{formatPrice(price)}</span>
                {off > 0 && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.rrp)}</span>}
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <AddToCartButton productId={product.id} name={product.name} variant="block" className="h-12 flex-1 px-6 sm:w-44" />
              <Button asChild variant="outline" className="h-12 px-5">
                <Link href={`/products/${product.slug}`}>
                  Details <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
