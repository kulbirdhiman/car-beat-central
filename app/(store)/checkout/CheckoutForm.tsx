"use client";

import { Loader2, Lock, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, useSyncExternalStore, type ReactNode } from "react";
import { placeOrder, type FormState } from "@/app/actions";
import { useCartProducts, useQuote } from "@/components/cart/hooks";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { AU_STATES, formatCents, formatPrice } from "@/lib/data";
import { DELIVERY_OPTIONS, type Delivery } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const noop = () => () => {};

export function CheckoutForm() {
  const lines = useCart();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, {});
  const [delivery, setDelivery] = useState<Delivery>("standard");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [email, setEmail] = useState("");
  const { products } = useCartProducts(lines);
  const { totals, stale } = useQuote(lines, { delivery, coupon, email: email.includes("@") ? email : undefined });
  const [auState, setAuState] = useState("");
  // Hide a field's error once the shopper edits it (until the next submit).
  const [edited, setEdited] = useState<{ state: FormState; names: string[] }>({ state, names: [] });
  const editedNames = edited.state === state ? edited.names : [];
  const markEdited = (name: string) =>
    setEdited((e) => ({ state, names: [...(e.state === state ? e.names : []), name] }));
  const errors = Object.fromEntries(Object.entries(state.errors ?? {}).filter(([k]) => !editedNames.includes(k)));
  const v = state.values ?? {};

  if (!hydrated) return <Skeleton className="h-96 w-full rounded-2xl" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed p-12 text-center">
        <p className="font-display text-3xl font-bold uppercase">Nothing to check out yet</p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/shop">Browse parts</Link>
        </Button>
      </div>
    );
  }

  const couponError = coupon && !stale ? totals?.couponError : null;

  return (
    <form
      action={action}
      noValidate
      onInput={(e) => markEdited((e.target as HTMLInputElement).name)}
      className="grid gap-8 lg:grid-cols-[1fr_400px]"
    >
      <input type="hidden" name="cart" value={JSON.stringify(lines)} />
      <input type="hidden" name="coupon" value={coupon} />

      <div className="space-y-6">
        {state.message && !state.ok && (
          <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive animate-in fade-in">
            {state.message}
          </p>
        )}

        <Section step={1} title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" error={errors.email}>
              <Input id="email" name="email" defaultValue={v.email} aria-invalid={!!errors.email} type="email" autoComplete="email" required onBlur={(e) => setEmail(e.target.value.trim())} />
            </Field>
            <Field label="Mobile" name="phone" error={errors.phone} hint="For delivery updates">
              <Input id="phone" name="phone" defaultValue={v.phone} aria-invalid={!!errors.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="0412 345 678" required />
            </Field>
          </div>
        </Section>

        <Section step={2} title="Delivery address">
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Full name" name="name" error={errors.name} className="sm:col-span-6">
              <Input id="name" name="name" defaultValue={v.name} aria-invalid={!!errors.name} autoComplete="name" required />
            </Field>
            <Field label="Street address" name="address" error={errors.address} className="sm:col-span-6">
              <Input id="address" name="address" defaultValue={v.address} aria-invalid={!!errors.address} autoComplete="street-address" required />
            </Field>
            <Field label="Suburb" name="suburb" error={errors.suburb} className="sm:col-span-3">
              <Input id="suburb" name="suburb" defaultValue={v.suburb} aria-invalid={!!errors.suburb} autoComplete="address-level2" required />
            </Field>
            <Field label="State" name="state" error={errors.state} className="sm:col-span-1">
              <Select name="state" required value={auState || v.state || ""} onValueChange={(s) => {
                  setAuState(s);
                  markEdited("state");
                }}>
                <SelectTrigger id="state" className="h-9 w-full" aria-invalid={!!errors.state}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {AU_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Postcode" name="postcode" error={errors.postcode} className="sm:col-span-2">
              <Input id="postcode" name="postcode" defaultValue={v.postcode} aria-invalid={!!errors.postcode} autoComplete="postal-code" inputMode="numeric" maxLength={4} required />
            </Field>
          </div>
        </Section>

        <Section step={3} title="Delivery">
          <RadioGroup name="delivery" value={delivery} onValueChange={(v) => setDelivery(v as Delivery)} className="gap-3">
            {(Object.keys(DELIVERY_OPTIONS) as Delivery[]).map((key) => {
              const opt = DELIVERY_OPTIONS[key];
              const free = opt.fee === 0 || (opt.freeOver !== null && totals && totals.subtotal - totals.discount >= opt.freeOver);
              return (
                <Label
                  key={key}
                  htmlFor={`delivery-${key}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 font-normal transition-colors",
                    delivery === key && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem id={`delivery-${key}`} value={key} />
                  <span className="flex-1">{opt.label}</span>
                  <span className="font-medium">{free ? "Free" : formatCents(opt.fee)}</span>
                </Label>
              );
            })}
          </RadioGroup>
        </Section>

        <Section step={4} title="Payment">
          <p className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" />
            Online card payments aren&apos;t switched on yet. Place your order and we&apos;ll email you a secure payment link. Nothing is charged until you pay.
          </p>
        </Section>
      </div>

      <Card className="h-fit lg:sticky lg:top-28">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-bold uppercase">Your order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ul className="space-y-3">
            {lines.map((l) => {
              const p = products[l.productId];
              return p ? (
                <li key={l.productId} className="flex items-center gap-3 text-sm">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />
                    <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-bl-lg bg-foreground text-[10px] font-bold text-background">{l.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="tabular-nums">{formatPrice((p.deal?.price ?? p.price) * l.qty)}</span>
                </li>
              ) : (
                <Skeleton key={l.productId} className="h-12 w-full" />
              );
            })}
          </ul>

          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setCoupon(couponInput.trim());
                    }
                  }}
                  placeholder="Offer code"
                  aria-label="Offer code"
                  aria-invalid={!!(couponError || errors.coupon)}
                  className="pl-9 font-mono uppercase"
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim()}>
                Apply
              </Button>
            </div>
            {(couponError || errors.coupon) && <p className="mt-1.5 text-xs text-destructive">{couponError || errors.coupon}</p>}
            {coupon && totals?.coupon === coupon && !stale && <p className="mt-1.5 text-xs text-success">{coupon} applied</p>}
          </div>

          <OrderSummary totals={totals} stale={stale} />

          <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={pending || !!couponError}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" /> Placing order…
              </>
            ) : (
              <>Place order{totals && ` · ${formatCents(totals.total)}`}</>
            )}
          </Button>
          {couponError && <p className="text-center text-xs text-muted-foreground">Remove or fix the offer code to continue.</p>}
        </CardContent>
      </Card>
    </form>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="mb-5 flex items-center gap-3 font-display text-2xl font-bold uppercase">
        <span className="grid size-8 place-items-center rounded-full bg-foreground font-sans text-sm text-background">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)} data-invalid={!!error || undefined}>
      <Label htmlFor={name}>{label}</Label>
      <div className="[&_input]:h-11">{children}</div>
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
