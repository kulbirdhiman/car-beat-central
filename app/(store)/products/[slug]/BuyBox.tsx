"use client";

import { Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";

type Props = { productId: string; name: string; image: string; price: number; stock: number };

/**
 * Quantity, Add to cart and Buy now. Once those buttons scroll out of view, a bar with the
 * same actions sticks to the bottom of the screen, so buying is always one tap away.
 */
export function BuyBox({ productId, name, image, price, stock }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    // Only once the buttons have scrolled up past the top, not before the shopper reaches them.
    const observer = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const add = () => {
    addToCart(productId, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast.success(`Added ${qty} to cart`, { description: name, action: { label: "Checkout", onClick: () => router.push("/checkout") } });
  };
  const buyNow = () => {
    addToCart(productId, qty);
    router.push("/checkout");
  };

  if (stock === 0) {
    return (
      <div ref={anchor} className="mt-5 grid gap-2">
        <Button size="xl" className="h-14 w-full rounded-xl text-base" disabled>
          Sold out
        </Button>
        <p className="text-center text-sm text-muted-foreground">Back soon. Check again in a few days.</p>
      </div>
    );
  }
  const maxQty = Math.min(20, stock);

  return (
    <>
      <div ref={anchor} className="mt-5 grid gap-3">
        <div className="flex gap-3">
          <div className="flex h-14 shrink-0 items-center rounded-xl border bg-background">
            <Button variant="ghost" size="icon-lg" className="ml-1 rounded-lg" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>
              <Minus />
            </Button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <Button variant="ghost" size="icon-lg" className="mr-1 rounded-lg" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)}>
              <Plus />
            </Button>
          </div>
          <Button size="xl" className={cn("h-14 flex-1 rounded-xl text-base", added && "bg-success hover:bg-success")} onClick={add}>
            {added ? <Check /> : <ShoppingBag />} {added ? "Added to cart" : "Add to cart"}
          </Button>
        </div>
        <Button size="xl" variant="ink" className="h-14 w-full rounded-xl text-base" onClick={buyNow}>
          <Zap className="fill-current" /> Buy now · {formatPrice(price * qty)}
        </Button>
      </div>

      <div
        aria-hidden={!showBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t bg-white/90 backdrop-blur-xl transition-transform duration-300",
          showBar ? "translate-y-0 shadow-[0_-12px_32px_-16px_oklch(0.2_0.01_25/0.3)]" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="relative hidden size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
            <Image src={image} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="hidden truncate text-sm font-semibold sm:block">{name}</p>
            <p className="font-display text-lg font-bold leading-tight">{formatPrice(price)}</p>
          </div>
          <Button size="xl" variant="outline" className="h-12 rounded-xl bg-background px-4" onClick={add} tabIndex={showBar ? 0 : -1}>
            {added ? <Check /> : <ShoppingBag />}
            <span className="hidden sm:inline">{added ? "Added" : "Add to cart"}</span>
          </Button>
          <Button size="xl" className="h-12 rounded-xl px-5" onClick={buyNow} tabIndex={showBar ? 0 : -1}>
            <Zap className="fill-current" /> Buy now
          </Button>
        </div>
      </div>
    </>
  );
}
