"use client";

import { Check, Minus, Plus, PackagePlus, ShoppingBag, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/data";
import { selectedOptionPriceAdjustment } from "@/lib/product-options";
import type { ProductOptionGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export type AddOn = { id: string; slug: string; name: string; image: string; price: number };

type Props = { productId: string; name: string; image: string; price: number; stock: number; optionGroups: ProductOptionGroup[]; addOns: AddOn[] };

/**
 * Add-ons, quantity, Add to cart and Buy now. Ticked add-ons go in the cart alongside the product, one of each.
 * Once the buttons scroll out of view, a bar with the same actions sticks to the bottom of the screen,
 * so buying is always one tap away.
 */
export function BuyBox({ productId, name, image, price, stock, optionGroups, addOns }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [selectedValues, setSelectedValues] = useState<string[]>(() => optionGroups.map(() => ""));
  const anchor = useRef<HTMLDivElement>(null);
  const extras = addOns.filter((a) => picked.has(a.id));
  const adjustment = selectedOptionPriceAdjustment(optionGroups, optionGroups.length ? selectedValues : undefined);
  const unitPrice = adjustment === null ? null : price + adjustment;
  const total = unitPrice === null ? null : unitPrice * qty + extras.reduce((n, a) => n + a.price, 0);
  const optionsReady = adjustment !== null;

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    // Only once the buttons have scrolled up past the top, not before the shopper reaches them.
    const observer = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const addAll = () => {
    addToCart(productId, qty, optionGroups.length ? selectedValues : undefined);
    for (const a of extras) addToCart(a.id, 1);
  };
  const add = () => {
    addAll();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    const selected = optionGroups.map((group, index) => `${group.name}: ${selectedValues[index]}`).join(" · ");
    const description = [selected || name, extras.length ? `${extras.length} add-on${extras.length > 1 ? "s" : ""}` : ""].filter(Boolean).join(" + ");
    toast.success(`Added ${qty + extras.length} to cart`, { description, action: { label: "Checkout", onClick: () => router.push("/checkout") } });
  };
  const buyNow = () => {
    addAll();
    router.push("/checkout");
  };
  const toggle = (id: string, on: boolean) =>
    setPicked((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

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
      {optionGroups.length > 0 && (
        <div className="mt-5 grid gap-3">
          {optionGroups.map((group, index) => (
            <label key={`${group.name}-${index}`} className="grid gap-1.5 text-sm font-medium">
              <span>{group.name} <span className="font-normal text-muted-foreground">({group.required ? "Required" : "Optional"})</span></span>
              <select
                value={selectedValues[index] ?? ""}
                onChange={(event) => setSelectedValues((values) => values.map((value, i) => i === index ? event.target.value : value))}
                className="h-11 rounded-lg border bg-background px-3 font-normal"
              >
                <option value="">{group.required ? `Choose ${group.name.toLowerCase()}` : `No ${group.name.toLowerCase()}`}</option>
                {group.values.map((choice) => <option key={choice.name} value={choice.name}>{choice.name}{choice.price > 0 ? ` (+${formatPrice(choice.price)})` : ""}</option>)}
              </select>
            </label>
          ))}
          <p className="text-sm text-muted-foreground">{unitPrice === null ? "Choose your options to see the price." : `Selected price: ${formatPrice(unitPrice)}`}</p>
        </div>
      )}
      {addOns.length > 0 && (
        <fieldset className="mt-5">
          <legend className="flex items-center gap-2 text-sm font-semibold">
            <PackagePlus className="size-4 text-primary" /> Add to your order
          </legend>
          <ul className="mt-2 grid gap-2">
            {addOns.map((a) => {
              const on = picked.has(a.id);
              return (
                <li key={a.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-2.5 pr-3 transition-colors hover:border-foreground/30",
                      on && "border-primary bg-primary/5 hover:border-primary",
                    )}
                  >
                    <Checkbox checked={on} onCheckedChange={(v) => toggle(a.id, v === true)} aria-label={`Add ${a.name}`} />
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image src={a.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-medium leading-snug">{a.name}</span>
                      <Link href={`/products/${a.slug}`} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        View details
                      </Link>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">+{formatPrice(a.price)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

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
          <Button size="xl" className={cn("h-14 flex-1 rounded-xl text-base", added && "bg-success hover:bg-success")} onClick={add} disabled={!optionsReady}>
            {added ? <Check /> : <ShoppingBag />} {added ? "Added to cart" : "Add to cart"}
          </Button>
        </div>
        <Button size="xl" variant="ink" className="h-14 w-full rounded-xl text-base" onClick={buyNow} disabled={!optionsReady}>
          <Zap className="fill-current" /> {total === null ? "Choose options" : `Buy now · ${formatPrice(total)}`}
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
            <p className="font-display text-lg font-bold leading-tight">{total === null ? "Choose options" : formatPrice(total)}</p>
            {extras.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Incl. {extras.length} add-on{extras.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button size="xl" variant="outline" className="h-12 rounded-xl bg-background px-4" onClick={add} tabIndex={showBar ? 0 : -1} disabled={!optionsReady}>
            {added ? <Check /> : <ShoppingBag />}
            <span className="hidden sm:inline">{added ? "Added" : "Add to cart"}</span>
          </Button>
          <Button size="xl" className="h-12 rounded-xl px-5" onClick={buyNow} tabIndex={showBar ? 0 : -1} disabled={!optionsReady}>
            <Zap className="fill-current" /> Buy now
          </Button>
        </div>
      </div>
    </>
  );
}
