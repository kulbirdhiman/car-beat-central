import type { Metadata } from "next";
import { Building2, CircleCheck, CircleX, Clock, ExternalLink, Lock, Mail, Package, RotateCcw, Store, Truck, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/data";
import { DEFAULT_PAYMENT_METHODS, orderReference } from "@/lib/payment";
import { DELIVERY_OPTIONS } from "@/lib/pricing";
import { isOpenReturn, returnDeadline, returnableQty } from "@/lib/returns";
import { CARRIERS, trackingUrl } from "@/lib/shipping";
import { afterpayAvailableFor } from "@/lib/server/afterpay";
import { getCustomer } from "@/lib/server/customer";
import { getOrder, listReturnsAndRefunds } from "@/lib/server/orders";
import { paypalEnabled } from "@/lib/server/paypal";
import { AfterpayButton } from "./AfterpayButton";
import { BankTransfer } from "./BankTransfer";
import { ClearCart } from "./ClearCart";
import { OrderHelp, type HelpProps } from "./OrderHelp";
import { PayPalCheckout } from "./PayPalCheckout";

export const metadata: Metadata = { title: "Your order · CarBeat", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const orderId = (await props.params).id;
  // Storefront order links are UUIDs. Imported WooCommerce IDs are admin-only and can be guessed.
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound();
  const order = await getOrder(orderId);
  if (!order) notFound();

  const reference = <span className="font-mono font-medium text-foreground">#{orderReference(order.id)}</span>;
  const firstName = order.name.split(" ")[0];
  const paid = order.status === "processing" || order.status === "paid" || order.status === "fulfilled";
  const shipped = order.status === "fulfilled";
  const tracking = shipped && order.shippingCarrier && order.trackingNumber ? { carrier: CARRIERS[order.shippingCarrier].name, number: order.trackingNumber, url: trackingUrl(order.shippingCarrier, order.trackingNumber) } : null;
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const awaitingPayment = order.status === "pending_payment";
  const isInvoice = order.source === "invoice";
  const methods = order.paymentMethods ?? DEFAULT_PAYMENT_METHODS;
  const payOnline = awaitingPayment && methods.includes("paypal") && paypalEnabled() && clientId;
  const payAfterpay = awaitingPayment && methods.includes("afterpay") && (await afterpayAvailableFor(order.total));
  // Why an Afterpay payment didn't go through, set by /api/afterpay/return.
  const afterpayProblem = awaitingPayment ? (await props.searchParams).afterpay : undefined;
  const payByBank = awaitingPayment && methods.includes("bank_transfer");
  const payInStore = awaitingPayment && methods.includes("in_store");
  const help = await helpFor(order);
  const howToPay = [payOnline && "PayPal or card", payAfterpay && "Afterpay", payByBank && "bank transfer", payInStore && "in store"].filter(Boolean).join(", ");

  const header = order.status === "refunded"
    ? { icon: <RotateCcw className="size-8 text-primary" />, tone: "bg-primary/10", title: "Order refunded", body: <>Order {reference} was refunded in full. It can take 3–5 business days to reach you.</> }
    : shipped
    ? {
        icon: <Truck className="size-8 text-success" />,
        tone: "bg-success/10",
        title: order.delivery === "collect" ? `Enjoy, ${firstName}.` : `On its way, ${firstName}.`,
        body: order.delivery === "collect" ? <>Order {reference} has been picked up.</> : <>Order {reference} has shipped.</>,
      }
    : paid
    ? { icon: <CircleCheck className="size-8 text-success" />, tone: "bg-success/10", title: `Thanks, ${firstName}.`, body: <>Order {reference} is paid. We&apos;ll email {order.email} with tracking.</> }
    : order.status === "cancelled"
      ? { icon: <CircleX className="size-8 text-destructive" />, tone: "bg-destructive/10", title: "Order cancelled", body: <>Order {reference} was cancelled. Questions? Reply to any of our emails.</> }
      : awaitingPayment
        ? isInvoice
          ? { icon: <Clock className="size-8 text-primary" />, tone: "bg-primary/10", title: `Invoice for ${firstName}`, body: <>Invoice {reference} for {formatCents(order.total)}. Pay below and we&apos;ll get it moving.</> }
          : { icon: <Clock className="size-8 text-primary" />, tone: "bg-primary/10", title: `Almost done, ${firstName}.`, body: <>Order {reference} is reserved for you. Pay below to confirm it.</> }
        : { icon: <CircleCheck className="size-8 text-success" />, tone: "bg-success/10", title: `Thanks, ${firstName}.`, body: <>Order {reference} is in. We&apos;ll email {order.email} with tracking.</> };

  return (
    <PageShell className="max-w-3xl">
      {/* An invoice link isn't a checkout, so it leaves the customer's cart alone. */}
      {!isInvoice && <ClearCart />}
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className={`mx-auto grid size-16 place-items-center rounded-lg animate-in zoom-in duration-500 ${header.tone}`}>{header.icon}</span>
        <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">{header.title}</h1>
        <p className="mt-2 text-muted-foreground">{header.body}</p>
      </div>

      {order.note && (
        <p className="mt-8 whitespace-pre-line rounded-lg bg-muted p-4 text-sm">{order.note}</p>
      )}

      {typeof afterpayProblem === "string" && (
        <p role="alert" className="mt-8 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {afterpayProblem.slice(0, 300)}
        </p>
      )}

      {payOnline && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4 font-display text-2xl font-bold">
              Pay {formatCents(order.total)}
              <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <Lock className="size-3.5" /> Secured by PayPal
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PayPalCheckout orderId={order.id} clientId={clientId} />
            <p className="mt-2 text-center text-xs text-muted-foreground">Pay with your PayPal account, Pay Later, or a debit or credit card. No PayPal account needed.</p>
          </CardContent>
        </Card>
      )}

      {payAfterpay && (
        <Card className={payOnline ? "mt-4" : "mt-10"}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4 font-display text-2xl font-bold">
              {payOnline ? "Or pay in 4 with Afterpay" : `Pay ${formatCents(order.total)} with Afterpay`}
              <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <Lock className="size-3.5" /> Secured by Afterpay
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AfterpayButton orderId={order.id} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              4 interest-free payments of {formatCents(Math.ceil(order.total / 4))}, paid fortnightly. You&apos;ll finish paying on Afterpay.
            </p>
          </CardContent>
        </Card>
      )}

      {payByBank && (
        <Card className={payOnline || payAfterpay ? "mt-4" : "mt-10"}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4 font-display text-2xl font-bold">
              {payOnline || payAfterpay ? "Or pay by bank transfer" : `Pay ${formatCents(order.total)} by bank transfer`}
              <Building2 className="size-5 shrink-0 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BankTransfer reference={orderReference(order.id)} amount={formatCents(order.total)} />
            <p className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Use <span className="font-mono font-medium text-foreground">{orderReference(order.id)}</span> as the payment reference so we can match it to your order. We ship once
              the transfer arrives, usually 1–2 business days, and email {order.email} to confirm.
            </p>
          </CardContent>
        </Card>
      )}

      {payInStore && (
        <Card className={payOnline || payAfterpay || payByBank ? "mt-4" : "mt-10"}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4 font-display text-2xl font-bold">
              {payOnline || payAfterpay || payByBank ? "Or pay in store" : `Pay ${formatCents(order.total)} in store`}
              <Store className="size-5 shrink-0 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pay by cash or EFTPOS when you visit. Quote <span className="font-mono font-medium text-foreground">{orderReference(order.id)}</span> so we can find your invoice.
            </p>
          </CardContent>
        </Card>
      )}

      {tracking && (
        <Card className="mt-10">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tracking with {tracking.carrier}</p>
              <p className="font-mono text-lg font-semibold break-all">{tracking.number}</p>
            </div>
            {tracking.url && (
              <Button asChild size="xl">
                <a href={tracking.url} target="_blank" rel="noreferrer">
                  Track parcel <ExternalLink />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ol className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          paid
            ? { icon: CircleCheck, title: "Paid", body: "Your payment went through." }
            : { icon: Mail, title: "Pay securely", body: howToPay ? `By ${howToPay}, above.` : "We'll be in touch about payment." },
          shipped
            ? { icon: Truck, title: order.delivery === "collect" ? "Picked up" : "Shipped", body: tracking ? `With ${tracking.carrier}` : DELIVERY_OPTIONS[order.delivery].label }
            : { icon: Package, title: "We pack & ship", body: DELIVERY_OPTIONS[order.delivery].label },
          { icon: Wrench, title: "Need fitting?", body: "Book a local installer any time." },
        ].map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-xl bg-card ring-1 ring-foreground/[0.07] p-5">
            <Icon className="size-5 text-primary" />
            <p className="mt-3 font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>

      <Card className="mt-8">
        <CardContent className="space-y-3 text-sm">
          {order.items.map((i) => (
            <div key={i.productId} className="flex justify-between gap-4">
              <span>
                {i.qty} × {i.name}
              </span>
              <span className="tabular-nums">{formatCents(i.unitPrice * i.qty)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount ({order.coupon})</span>
              <span>−{formatCents(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{order.shipping ? formatCents(order.shipping) : "Free"}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total (incl. GST)</span>
            <span>{formatCents(order.total)}</span>
          </div>
          {order.refundedTotal > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Refunded</span>
              <span>−{formatCents(order.refundedTotal)}</span>
            </div>
          )}
          <Separator />
          <p className="text-muted-foreground">
            Delivering to {order.name}, {order.address}, {order.suburb} {order.state} {order.postcode}
          </p>
        </CardContent>
      </Card>

      {help && <OrderHelp {...help} />}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="xl">
          <Link href="/fitting">Book a fitting</Link>
        </Button>
        <Button asChild size="xl" variant="outline">
          <Link href="/shop">Keep shopping</Link>
        </Button>
      </div>
    </PageShell>
  );
}

/** What the order's cancellations & returns section shows the person viewing it, or null to leave it out. */
async function helpFor(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>): Promise<HelpProps | null> {
  const [customer, history] = await Promise.all([getCustomer(), listReturnsAndRefunds([order.id])]);
  const returns = history.returns.get(order.id) ?? [];
  const refunds = history.refunds.get(order.id) ?? [];
  // A cancelled unpaid order has nothing to show.
  if (order.status === "cancelled" && returns.length === 0 && refunds.length === 0) return null;

  const viewer = !customer ? "guest" : order.userId === customer.id || customer.emails.includes(order.email.toLowerCase()) ? "owner" : "other";
  const open = returns.some(isOpenReturn);
  const deadline = returnDeadline(order.shippedAt);
  const windowOpen = order.status === "fulfilled" && !!deadline && deadline.getTime() > Date.now();
  const left = returnableQty(order.items, returns);
  const returnable =
    windowOpen && !open
      ? [...left].filter(([, max]) => max > 0).map(([productId, max]) => ({ productId, max, name: order.items.find((i) => i.productId === productId)!.name }))
      : [];

  return {
    orderId: order.id,
    viewer,
    email: order.email,
    canCancel: order.status === "pending_payment",
    canRequestCancel: (order.status === "processing" || order.status === "paid") && !open,
    returnable,
    returnBy: deadline?.toISOString() ?? null,
    windowClosed: order.status === "fulfilled" && !!deadline && !windowOpen,
    returns,
    refunds,
  };
}
