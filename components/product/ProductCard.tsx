import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Card className="group/product relative h-full gap-0 py-0 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover/product:scale-105"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          {product.deal ? (
            <Badge variant="destructive" className="bg-destructive text-white">Today&apos;s deal</Badge>
          ) : product.badge ? (
            <Badge className="bg-background/90 text-foreground backdrop-blur">{product.badge}</Badge>
          ) : (
            <span />
          )}
          <Badge>-{off}%</Badge>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.brand} · {CATEGORY_LABELS[product.category]}
        </p>
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">
          {/* Stretched link: the whole card is clickable, while the cart button stays on top. */}
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-primary text-primary" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviews.toLocaleString("en-AU")})</span>
          {product.fits === "universal" && <span className="ml-auto">Universal fit</span>}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-xl font-semibold tracking-tight">{formatPrice(price)}</p>
            <p className="text-xs text-muted-foreground">
              RRP <span className="line-through">{formatPrice(product.rrp)}</span>
            </p>
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
