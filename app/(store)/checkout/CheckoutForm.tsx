"use client";

import { ArrowLeft, Check, Loader2, Lock, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { placeOrder, type FormState } from "@/app/actions";
import { useCartProducts, useQuote } from "@/components/cart/hooks";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { SuburbInput } from "@/components/address/SuburbInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { AU_STATES, formatCents, formatPrice } from "@/lib/data";
import type { PaymentMethod } from "@/lib/payment";
import { DELIVERY_OPTIONS, type Delivery } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const noop = () => () => {};

type Step = 1 | 2 | 3;
const STEPS: { step: Step; title: string }[] = [
  { step: 1, title: "Your details" },
  { step: 2, title: "Delivery" },
  { step: 3, title: "Payment" },
];
const DETAIL_FIELDS = ["email", "phone", "name", "address", "suburb", "state", "postcode"] as const;

/** The server's checks on step 1 (lib/server/validate.ts), so mistakes show before moving on. The server still checks everything. */
function validateDetails(form: FormData): Record<string, string> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) errors.email = "Enter a valid email address.";
  if (!/^(\+?61|0)[2-478]\d{8}$/.test(get("phone").replace(/[\s()-]/g, ""))) errors.phone = "Enter an Australian phone number, e.g. 0412 345 678.";
  if (get("name").length < 2) errors.name = "Enter your full name.";
  if (get("address").length < 5) errors.address = "Enter your street address.";
  if (get("suburb").length < 2) errors.suburb = "Enter your suburb.";
  if (!(AU_STATES as readonly string[]).includes(get("state"))) errors.state = "Choose a state.";
  if (!/^\d{4}$/.test(get("postcode"))) errors.postcode = "Postcodes are 4 digits.";
  return errors;
}

/** A signed-in customer's email and default address, filled in for them. */
export type CheckoutPrefill = Record<"email" | "name" | "phone" | "address" | "suburb" | "state" | "postcode", string>;

/**
 * `payOnline`: PayPal is set up, so the order is paid on the next page instead of by an emailed link.
 * `afterpay`: the order totals (in cents) Afterpay accepts, when it's set up.
 * `prefill`: set when the shopper is signed in.
 */
export function CheckoutForm({
  payOnline,
  afterpay,
  prefill,
}: {
  payOnline: boolean;
  afterpay: { min: number; max: number } | null;
  prefill: CheckoutPrefill | null;
}) {
  const lines = useCart();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, {});
  const [delivery, setDelivery] = useState<Delivery>("standard");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [step, setStep] = useState<Step>(1);
  const [payment, setPayment] = useState<PaymentMethod>(payOnline ? "paypal" : "bank_transfer");
  // What was entered in step 1, shown once the shopper moves on.
  const [details, setDetails] = useState<Record<string, string> | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const { products } = useCartProducts(lines);
  const { totals, stale } = useQuote(lines, { delivery, coupon, email: email.includes("@") ? email : undefined });
  // Hide a field's error once the shopper edits it (until the next submit).
  const [edited, setEdited] = useState<{ state: FormState; names: string[] }>({ state, names: [] });
  const editedNames = edited.state === state ? edited.names : [];
  const markEdited = (name: string) => {
    setEdited((e) => ({ state, names: [...(e.state === state ? e.names : []), name] }));
    setStepErrors((e) => (name in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== name)) : e));
  };
  const errors = { ...Object.fromEntries(Object.entries(state.errors ?? {}).filter(([k]) => !editedNames.includes(k))), ...stepErrors };
  // When the server sends errors back, go to the step that has them.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (Object.keys(state.errors ?? {}).some((k) => (DETAIL_FIELDS as readonly string[]).includes(k))) setStep(1);
    else if (state.errors?.payment) setStep(3);
  }
  const v = state.values ?? prefill ?? {};
  const [place, setPlace] = useState({ suburb: v.suburb ?? "", state: v.state ?? "", postcode: v.postcode ?? "" });

  if (!hydrated) return <Skeleton className="h-96 w-full rounded-xl" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-display text-3xl font-bold">Nothing to check out yet</p>
        <Button asChild size="lg" className="mt-6 h-10 px-4">
          <Link href="/shop">Browse parts</Link>
        </Button>
      </div>
    );
  }

  const couponError = coupon && !stale ? totals?.couponError : null;
  // Pay on pickup goes away if the shopper switches from pickup to delivery, and Afterpay if the total leaves its range.
  const defaultPayment: PaymentMethod = payOnline ? "paypal" : "bank_transfer";
  const afterpayOk = !!afterpay && !!totals && totals.total >= afterpay.min && totals.total <= afterpay.max;
  const paymentMethod = (payment === "in_store" && delivery !== "collect") || (payment === "afterpay" && !afterpayOk) ? defaultPayment : payment;
  const paymentOptions = [
    payOnline && { key: "paypal" as const, title: "PayPal or card", body: "PayPal, Pay Later, or a debit or credit card. You don't need a PayPal account." },
    afterpayOk && {
      key: "afterpay" as const,
      title: "Afterpay",
      body: `4 interest-free payments of ${formatCents(Math.ceil(totals.total / 4))}. You'll finish paying on Afterpay.`,
    },
    { key: "bank_transfer" as const, title: "Bank transfer", body: "We'll show our bank details on the next page. Your order goes out once the payment arrives." },
    delivery === "collect" && { key: "in_store" as const, title: "Pay on pickup", body: "Pay by cash or EFTPOS when you collect your order." },
  ].filter((o) => !!o);

  function next() {
    if (step === 1) {
      const form = new FormData(formRef.current!);
      const problems = validateDetails(form);
      setStepErrors(problems);
      if (Object.keys(problems).length) {
        formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(problems)[0]}"]`)?.focus();
        return;
      }
      setDetails(Object.fromEntries(DETAIL_FIELDS.map((k) => [k, String(form.get(k) ?? "").trim()])));
      setEmail(String(form.get("email") ?? "").trim());
    }
    goTo((step + 1) as Step);
  }

  function goTo(n: Step) {
    setStep(n);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      // Steps 1 and 2 move on instead of placing the order (Enter in a field does the same).
      onSubmit={(e) => {
        if (step === 3) return;
        e.preventDefault();
        next();
      }}
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

        <ol className="flex items-center gap-2 text-sm" aria-label="Checkout steps">
          {STEPS.map(({ step: n, title }, i) => (
            <li key={n} className="flex items-center gap-2">
              {i > 0 && <span className="h-px w-6 bg-border sm:w-10" aria-hidden />}
              <span
                aria-current={n === step ? "step" : undefined}
                className={cn("flex items-center gap-2 font-medium", n === step ? "text-foreground" : "text-muted-foreground")}
              >
                <span className={cn("grid size-6 place-items-center rounded-full text-xs", n < step ? "bg-success text-background" : n === step ? "bg-foreground text-background" : "bg-muted")}>
                  {n < step ? <Check className="size-3.5" /> : n}
                </span>
                <span className={n === step ? "" : "hidden sm:inline"}>{title}</span>
              </span>
            </li>
          ))}
        </ol>

        <Section
          step={1}
          title="Your details"
          current={step}
          onEdit={() => goTo(1)}
          summary={
            details && (
              <>
                <p className="font-medium text-foreground">{details.name}</p>
                <p>
                  {details.email} · {details.phone}
                </p>
                <p>
                  {details.address}, {details.suburb} {details.state} {details.postcode}
                </p>
              </>
            )
          }
        >
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            {prefill ? (
              <>
                Signed in as <span className="font-medium text-foreground">{prefill.email}</span>. This order will show in{" "}
                <Link href="/account/orders" className="font-medium text-primary hover:underline">
                  your account
                </Link>
                .
              </>
            ) : (
              <>
                Have an account?{" "}
                <Link href="/sign-in?redirect_url=/checkout" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to fill in your address and track this order.
              </>
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" error={errors.email}>
              <Input id="email" name="email" defaultValue={v.email} aria-invalid={!!errors.email} type="email" autoComplete="email" required onBlur={(e) => setEmail(e.target.value.trim())} />
            </Field>
            <Field label="Mobile" name="phone" error={errors.phone} hint="For delivery updates">
              <Input id="phone" name="phone" defaultValue={v.phone} aria-invalid={!!errors.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="0412 345 678" required />
            </Field>
          </div>
          <div className="mt-4">
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="Full name" name="name" error={errors.name} className="sm:col-span-6">
                <Input id="name" name="name" defaultValue={v.name} aria-invalid={!!errors.name} autoComplete="name" required />
              </Field>
              <Field label="Street address" name="address" error={errors.address} className="sm:col-span-6">
                <Input id="address" name="address" defaultValue={v.address} aria-invalid={!!errors.address} autoComplete="address-line1" placeholder="e.g. 12 Smith Street" required />
              </Field>
              <Field label="State" name="state" error={errors.state} className="sm:col-span-2">
                <Select
                  name="state"
                  required
                  value={place.state}
                  onValueChange={(s) => {
                    setPlace((p) => ({ ...p, state: s }));
                    markEdited("state");
                  }}
                >
                  <SelectTrigger id="state" className="h-11! w-full" aria-invalid={!!errors.state}>
                    <SelectValue placeholder="Select state" />
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
              <Field label="Suburb / city" name="suburb" error={errors.suburb} className="sm:col-span-2">
                <SuburbInput
                  id="suburb"
                  name="suburb"
                  value={place.suburb}
                  state={place.state || undefined}
                  invalid={!!errors.suburb}
                  onChange={(suburb) => setPlace((p) => ({ ...p, suburb }))}
                  onPick={(l) => {
                    setPlace(l);
                    ["suburb", "state", "postcode"].forEach(markEdited);
                  }}
                />
              </Field>
              <Field label="Postcode" name="postcode" error={errors.postcode} className="sm:col-span-2">
                <Input
                  id="postcode"
                  name="postcode"
                  value={place.postcode}
                  onChange={(e) => setPlace((p) => ({ ...p, postcode: e.target.value.replace(/\D/g, "") }))}
                  aria-invalid={!!errors.postcode}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={4}
                  required
                />
              </Field>
            </div>
          </div>
          <StepButtons>
            <Button type="submit" size="lg" className="h-11 px-6">
              Continue to delivery
            </Button>
          </StepButtons>
        </Section>

        <Section step={2} title="Delivery" current={step} onEdit={() => goTo(2)} summary={DELIVERY_OPTIONS[delivery].label}>
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
          <StepButtons onBack={() => goTo(1)}>
            <Button type="submit" size="lg" className="h-11 px-6">
              Continue to payment
            </Button>
          </StepButtons>
        </Section>

        <Section step={3} title="Payment" current={step} onEdit={() => goTo(3)}>
          <RadioGroup name="payment" value={paymentMethod} onValueChange={(v) => setPayment(v as PaymentMethod)} className="gap-3">
            {paymentOptions.map((o) => (
              <Label
                key={o.key}
                htmlFor={`payment-${o.key}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 font-normal transition-colors",
                  paymentMethod === o.key && "border-primary bg-primary/5",
                )}
              >
                <RadioGroupItem id={`payment-${o.key}`} value={o.key} className="mt-0.5" />
                <span className="flex-1">
                  <span className="block font-medium">{o.title}</span>
                  <span className="block text-sm text-muted-foreground">{o.body}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
          {errors.payment && <p className="mt-2 text-xs text-destructive">{errors.payment}</p>}
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" />{" "}
            {paymentMethod === "afterpay" ? "You'll be taken to Afterpay to pay securely." : <>You&apos;ll review the total and pay on the next page.</>}
          </p>
          <StepButtons onBack={() => goTo(2)}>
            <Button type="submit" size="lg" className="h-11 px-6" disabled={pending || !!couponError}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" /> Placing order…
                </>
              ) : (
                <>Place order{totals && ` · ${formatCents(totals.total)}`}</>
              )}
            </Button>
          </StepButtons>
        </Section>
      </div>

      <Card className="h-fit lg:sticky lg:top-32">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-bold">Your order</CardTitle>
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
                  className="h-10 pl-9 font-mono uppercase"
                />
              </div>
              <Button type="button" variant="ink" className="h-10 px-4" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim()}>
                Apply
              </Button>
            </div>
            {(couponError || errors.coupon) && <p className="mt-1.5 text-xs text-destructive">{couponError || errors.coupon}</p>}
            {coupon && totals?.coupon === coupon && !stale && <p className="mt-1.5 text-xs text-success">{coupon} applied</p>}
          </div>

          <OrderSummary totals={totals} stale={stale} />

          <Button type="submit" size="xl" className="w-full" disabled={pending || (step === 3 && !!couponError)}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" /> Placing order…
              </>
            ) : step === 1 ? (
              "Continue to delivery"
            ) : step === 2 ? (
              "Continue to payment"
            ) : (
              <>
                Place order
                {totals && ` · ${formatCents(totals.total)}`}
              </>
            )}
          </Button>
          {couponError && <p className="text-center text-xs text-muted-foreground">Remove or fix the offer code to continue.</p>}
        </CardContent>
      </Card>
    </form>
  );
}

/**
 * One checkout step. Only the current step is open; finished steps show `summary` with an Edit link.
 * Every step's fields stay mounted (just hidden) so they're all submitted with the order.
 */
function Section({
  step,
  title,
  current,
  summary,
  onEdit,
  children,
}: {
  step: Step;
  title: string;
  current: Step;
  summary?: ReactNode;
  onEdit: () => void;
  children: ReactNode;
}) {
  const open = step === current;
  const done = step < current;
  return (
    <section className={cn("rounded-xl bg-card p-6 ring-1 ring-foreground/[0.07]", !open && !done && "opacity-60")}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-2xl font-bold">
          <span className={cn("label-mono grid size-8 place-items-center rounded-md", done ? "bg-success text-background" : "bg-foreground text-background")}>
            {done ? <Check className="size-4" /> : String(step).padStart(2, "0")}
          </span>
          {title}
        </h2>
        {done && (
          <Button type="button" variant="link" className="h-auto p-0" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
      {done && summary && <div className="mt-3 space-y-0.5 pl-11 text-sm text-muted-foreground">{summary}</div>}
      <div hidden={!open} className="mt-5">
        {children}
      </div>
    </section>
  );
}

function StepButtons({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
      ) : (
        <span />
      )}
      {children}
    </div>
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
    <div className={cn("grid content-start gap-1.5", className)} data-invalid={!!error || undefined}>
      <Label htmlFor={name}>{label}</Label>
      <div className="[&_input]:h-11">{children}</div>
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
