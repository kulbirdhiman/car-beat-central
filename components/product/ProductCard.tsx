import { CarFront, CheckCircle2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { discountPercent, formatPrice } from "@/lib/data";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";

type Props = {
  product: Product;
  /** Extra content under the price, e.g. a deal's stock bar. */
  footer?: ReactNode;
  sizes?: string;
  className?: string;
};

/**
 * Retail product tile: image with discount flag, brand, title, fitment, rating,
 * price against RRP, then a full-width cart button so the action is never hunted for.
 */
export function ProductCard({ product, footer, sizes = "(min-width: 1024px) 25vw, 50vw", className }: Props) {
  const price = product.deal?.price ?? product.price;
  const off = discountPercent(price, product.rrp);
  const flag = product.deal ? "Today's deal" : product.badge;
  const fitsCount = product.fits === "universal" ? null : product.fits.length;

  return (
    <article
      className={cn(
        "group/product relative flex h-full flex-col rounded-xl border bg-card p-2.5 transition-[border-color,box-shadow] duration-300 hover:border-foreground/15 hover:shadow-[0_18px_40px_-24px_oklch(0.25_0.01_25/0.35)] sm:p-3",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover/product:scale-105"
        />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {off > 0 ? (
            <span className="rounded-md bg-destructive px-2 py-1 text-[11px] font-bold leading-none text-white">{off}% OFF</span>
          ) : (
            <span />
          )}
          {flag && (
            <span className={cn("hidden truncate rounded-md px-2 py-1 text-[11px] font-semibold leading-none sm:block", product.deal ? "bg-primary text-primary-foreground" : "bg-card/90 text-foreground backdrop-blur")}>
              {flag}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 sm:text-[15px]">
          {/* Stretched link: the whole card is clickable, while the cart button stays on top. */}
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:text-primary focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{product.rating}</span>({product.reviews.toLocaleString("en-AU")})
          </span>
          <span className="flex items-center gap-1">
            {fitsCount === null ? (
              <>
                <CheckCircle2 className="size-3.5 text-success" /> Universal fit
              </>
            ) : (
              <>
                <CarFront className="size-3.5 text-primary" /> Fits {fitsCount} models
              </>
            )}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn("font-display text-xl font-bold tabular-nums sm:text-2xl", off > 0 && "text-destructive")}>{formatPrice(price)}</span>
            {off > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.rrp)}</span>}
          </div>
          {off > 0 && <p className="mt-0.5 text-xs font-medium text-success">Save {formatPrice(product.rrp - price)}</p>}
          {footer && <div className="relative z-10">{footer}</div>}
          <div className="relative z-10 mt-3">
            <AddToCartButton productId={product.id} name={product.name} variant="block" />
          </div>
        </div>
      </div>
    </article>
  );
}
