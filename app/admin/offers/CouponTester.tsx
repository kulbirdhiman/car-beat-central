"use client";

import { Check, FlaskConical, X } from "lucide-react";
import { useState } from "react";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { couponCoversProduct, evaluateCoupon, type TestLine } from "@/lib/admin/coupons";
import type { Coupon } from "@/lib/admin/model";
import { formatCents, formatPrice } from "@/lib/data";

/** Try the coupon (as currently filled in) against a sample cart before saving it. */
export function CouponTester({ coupon }: { coupon: Coupon }) {
  const { products } = useAdminStore();
  const [cart, setCart] = useState<{ productId: string; qty: number }[]>(() => products.slice(0, 2).map((p) => ({ productId: p.id, qty: 1 })));
  const [firstOrder, setFirstOrder] = useState(true);
  const [adding, setAdding] = useState("");

  const lines: TestLine[] = cart.flatMap((l) => {
    const product = products.find((p) => p.id === l.productId);
    return product ? [{ product, qty: l.qty }] : [];
  });
  const result = evaluateCoupon(coupon, lines, { isFirstOrder: firstOrder });
  const subtotal = lines.reduce((s, l) => s + l.product.price * 100 * l.qty, 0);

  function add(productId: string) {
    setCart((c) => (c.some((l) => l.productId === productId) ? c.map((l) => (l.productId === productId ? { ...l, qty: Math.min(20, l.qty + 1) } : l)) : [...c, { productId, qty: 1 }]));
    setAdding("");
  }

  return (
    <section className="rounded-lg border bg-muted/40 p-3" aria-labelledby="coupon-tester">
      <h3 id="coupon-tester" className="mb-2 flex items-center gap-2 text-sm font-medium">
        <FlaskConical className="size-4" /> Test this coupon
      </h3>

      <ul className="mb-2 divide-y rounded-md border bg-background">
        {lines.length === 0 && <li className="px-3 py-3 text-center text-sm text-muted-foreground">Add products to build a test cart.</li>}
        {lines.map((l) => {
          const covered = couponCoversProduct(coupon, l.product);
          return (
            <li key={l.product.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              {covered ? (
                <Check className="size-4 shrink-0 text-emerald-600" aria-label="Qualifies" />
              ) : (
                <X className="size-4 shrink-0 text-muted-foreground" aria-label="Doesn't qualify" />
              )}
              <span className={covered ? "min-w-0 flex-1 truncate" : "min-w-0 flex-1 truncate text-muted-foreground"}>{l.product.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{formatPrice(l.product.price)} ×</span>
              <Input
                type="number"
                min={1}
                max={20}
                value={l.qty}
                onChange={(e) => {
                  const qty = Math.max(1, Math.min(20, Number(e.target.value) || 1));
                  setCart((c) => c.map((x) => (x.productId === l.product.id ? { ...x, qty } : x)));
                }}
                className="h-7 w-14 px-2 text-right"
                aria-label={`Quantity of ${l.product.name}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setCart((c) => c.filter((x) => x.productId !== l.product.id))}
                aria-label={`Remove ${l.product.name}`}
              >
                <X />
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Select value={adding} onValueChange={add}>
          <SelectTrigger className="h-8 w-56 bg-background" aria-label="Add a product to the test cart">
            <SelectValue placeholder="Add product…" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={firstOrder} onCheckedChange={(v) => setFirstOrder(v === true)} />
          Customer&apos;s first order
        </label>
      </div>

      <dl className="space-y-1 text-sm" aria-live="polite">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Cart subtotal</dt>
          <dd className="tabular-nums">{formatCents(subtotal)}</dd>
        </div>
        {result.ok ? (
          <>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Qualifying items</dt>
              <dd className="tabular-nums">{formatCents(result.eligibleSubtotal)}</dd>
            </div>
            <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
              <dt>
                {coupon.code || "Coupon"} {result.capped && <span className="font-normal">(capped at ${coupon.maxDiscount})</span>}
              </dt>
              <dd className="tabular-nums">{result.freeShipping ? "Free shipping" : `−${formatCents(result.discount)}`}</dd>
            </div>
            {!result.freeShipping && (
              <div className="flex justify-between border-t pt-1 font-semibold">
                <dt>After discount</dt>
                <dd className="tabular-nums">{formatCents(subtotal - result.discount)}</dd>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-between gap-4 text-destructive">
            <dt>Doesn&apos;t apply</dt>
            <dd className="text-right">{result.reason}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
