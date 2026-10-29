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
  const [selectedValues, setSelectedValues] = useState<string[][]>(() => optionGroups.map(() => []));
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
    const selected = optionGroups.map((group, index) => `${group.name}: ${selectedValues[index].join(", ")}`).join(" · ");
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
        <section className="mt-6 overflow-hidden rounded-2xl border bg-background" aria-label="Product options">
          <div className="border-b bg-muted/30 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold">Make it yours</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Choose your options. You can select more than one.</p>
          </div>
          <div className="divide-y px-4 sm:px-5">
            {optionGroups.map((group, index) => {
              const count = selectedValues[index].length;
              return (
                <fieldset key={`${group.name}-${index}`} className="min-w-0 py-4">
                  <legend className="sr-only">{group.name} ({group.required ? "select at least one" : "optional"})</legend>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2" aria-hidden="true">
                    <span className="text-sm font-semibold">{group.name}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      {count > 0 ? `${count} selected` : group.required ? "Select at least one" : "Optional"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {group.values.map((choice) => {
                      const selected = selectedValues[index].includes(choice.name);
                      return (
                        <label
                          key={choice.name}
                          className={cn(
                            "flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                            selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-foreground/30 hover:bg-muted/40",
                          )}
                        >
                          <Checkbox
                            className="size-5 rounded-md"
                            checked={selected}
                            onCheckedChange={(checked) => setSelectedValues((values) => values.map((value, i) => i === index
                              ? group.values.filter((item) => item.name === choice.name ? checked === true : value.includes(item.name)).map((item) => item.name)
                              : value))}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-sm font-medium leading-snug">{choice.name}</span>
                            <span className={cn("mt-1 block text-xs tabular-nums", selected ? "text-primary" : "text-muted-foreground")}>
                              {choice.price > 0 ? `+${formatPrice(choice.price)}` : "No extra cost"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3 sm:px-5" aria-live="polite" aria-atomic="true">
            <span className="text-xs text-muted-foreground">{unitPrice === null ? "Select required options to continue" : "Price with your options"}</span>
            {unitPrice !== null && <span className="text-base font-semibold tabular-nums">{formatPrice(unitPrice)}</span>}
          </div>
        </section>
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
