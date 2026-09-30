import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_LABELS, discountPercent, formatPrice } from "@/lib/data";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./AddToCartButton";

type Props = {
  product: Product;
  footer?: ReactNode;
  sizes?: string;
};

export function ProductCard({ product, footer, sizes = "(min-width: 1024px) 25vw, 50vw" }: Props) {
  const price = product.deal?.price ?? product.price;
  const off = discountPercent(price, product.rrp);
  const flag = product.deal
    ? { label: "Today's deal", short: "Deal", className: "bg-destructive text-white" }
    : product.badge
      ? { label: product.badge, short: product.badge, className: "bg-background/90 text-foreground backdrop-blur" }
      : null;

  return (
    <Card className="group/product relative h-full gap-0 rounded-xl py-0 transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_oklch(0.3_0.04_50/0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover/product:scale-105"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {flag ? (
            <span className={`label-mono truncate whitespace-nowrap rounded-sm px-2 py-1 ${flag.className}`}>
              <span className="sm:hidden">{flag.short}</span>
              <span className="hidden sm:inline">{flag.label}</span>
            </span>
          ) : (
            <span />
          )}
          {off > 0 && <span className="shrink-0 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-foreground">−{off}%</span>}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="label-mono truncate text-muted-foreground">
          {product.brand}
          <span className="hidden sm:inline"> · {CATEGORY_LABELS[product.category]}</span>
        </p>
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">
          {/* Stretched link: the whole card is clickable, while the cart button stays on top. */}
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
            {product.name}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-primary text-primary" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviews.toLocaleString("en-AU")})</span>
          {product.fits === "universal" && <span className="ml-auto hidden sm:inline">Universal fit</span>}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="font-display text-xl font-bold leading-none tabular-nums">{formatPrice(price)}</p>
            {off > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                RRP <span className="line-through">{formatPrice(product.rrp)}</span>
              </p>
            )}
          </div>
          <div className="relative z-10">
            <AddToCartButton productId={product.id} name={product.name} />
          </div>
        </div>
        {footer && <div className="relative z-10">{footer}</div>}
      </CardContent>
    </Card>
  );
}
