"use client";

import { ArrowRight, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useCartProducts, useQuote } from "@/components/cart/hooks";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { removeFromCart, setQty, useCart } from "@/lib/cart";
import { CATEGORY_LABELS, formatPrice } from "@/lib/data";

const noop = () => () => {};

export function CartView() {
  const lines = useCart();
  // The cart lives in localStorage, so wait for hydration before deciding it's empty.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const { products, loading } = useCartProducts(lines);
  const { totals, stale } = useQuote(lines, { delivery: "standard" });

  if (!hydrated) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-foreground/20 px-6 py-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-muted">
          <ShoppingBag className="size-6 text-muted-foreground" />
        </span>
        <p className="mt-4 font-display text-3xl font-bold">Your cart is empty</p>
        <p className="mt-2 text-muted-foreground">Find parts that fit your car and they&apos;ll show up here.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-10 px-4">
            <Link href="/shop">Start shopping</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-10 px-4">
            <Link href="/shop?sale=1">See today&apos;s deals</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y self-start rounded-xl bg-card ring-1 ring-foreground/[0.07]">
        {lines.map((line) => {
          const p = products[line.productId];
          if (!p) {
            return loading ? (
              <li key={line.productId} className="flex gap-4 p-4">
                <Skeleton className="size-24 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </li>
            ) : null;
          }
          const unit = p.deal?.price ?? p.price;
          return (
            <li key={line.productId} className="flex gap-4 p-4 animate-in fade-in sm:p-5">
              <Link href={`/products/${p.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={p.image} alt={p.name} fill sizes="96px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label-mono text-muted-foreground">{CATEGORY_LABELS[p.category]}</p>
                    <Link href={`/products/${p.slug}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    {p.deal && <p className="text-xs font-medium text-destructive">Today&apos;s deal price</p>}
                  </div>
                  <p className="font-display text-lg font-bold tabular-nums">{formatPrice(unit * line.qty)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-md border bg-background">
                    <Button variant="ghost" size="icon" aria-label="Decrease quantity" onClick={() => setQty(p.id, line.qty - 1)}>
                      <Minus />
                    </Button>
                    <span className="w-7 text-center text-sm tabular-nums">{line.qty}</span>
                    <Button variant="ghost" size="icon" aria-label="Increase quantity" disabled={line.qty >= 20} onClick={() => setQty(p.id, line.qty + 1)}>
                      <Plus />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => removeFromCart(p.id)}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Card className="h-fit lg:sticky lg:top-32">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-bold">Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <OrderSummary totals={totals} stale={stale} />
          <Button asChild size="xl" className="group w-full">
            <Link href="/checkout">
              Checkout <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> Offer codes are applied at checkout
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
