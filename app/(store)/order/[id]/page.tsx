import type { Metadata } from "next";
import { CircleCheck, CircleX, Clock, Lock, Mail, Package, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/data";
import { DELIVERY_OPTIONS } from "@/lib/pricing";
import { getOrder } from "@/lib/server/orders";
import { paypalEnabled } from "@/lib/server/paypal";
import { ClearCart } from "./ClearCart";
import { PayPalCheckout } from "./PayPalCheckout";

export const metadata: Metadata = { title: "Your order · CarBeat", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const order = await getOrder((await props.params).id);
  if (!order) notFound();

  const reference = <span className="font-mono font-medium text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>;
  const firstName = order.name.split(" ")[0];
  const paid = order.status === "paid" || order.status === "fulfilled";
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const payOnline = order.status === "pending_payment" && paypalEnabled() && clientId;

  const header = paid
    ? { icon: <CircleCheck className="size-8 text-success" />, tone: "bg-success/10", title: `Thanks, ${firstName}.`, body: <>Order {reference} is paid. We&apos;ll email {order.email} with tracking.</> }
    : order.status === "cancelled"
      ? { icon: <CircleX className="size-8 text-destructive" />, tone: "bg-destructive/10", title: "Order cancelled", body: <>Order {reference} was cancelled. Questions? Reply to any of our emails.</> }
      : payOnline
        ? { icon: <Clock className="size-8 text-primary" />, tone: "bg-primary/10", title: `Almost done, ${firstName}.`, body: <>Order {reference} is reserved for you. Pay below to confirm it.</> }
        : { icon: <CircleCheck className="size-8 text-success" />, tone: "bg-success/10", title: `Thanks, ${firstName}.`, body: <>Order {reference} is in. We&apos;ll email {order.email} with your payment link and tracking.</> };

  return (
    <PageShell className="max-w-3xl">
      <ClearCart />
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className={`mx-auto grid size-16 place-items-center rounded-lg animate-in zoom-in duration-500 ${header.tone}`}>{header.icon}</span>
        <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">{header.title}</h1>
        <p className="mt-2 text-muted-foreground">{header.body}</p>
      </div>

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

      <ol className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          paid
            ? { icon: CircleCheck, title: "Paid", body: "Your payment went through." }
            : { icon: Mail, title: "Pay securely", body: payOnline ? "With PayPal or card, above." : "Check your inbox for a payment link." },
          { icon: Package, title: "We pack & ship", body: DELIVERY_OPTIONS[order.delivery].label },
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
          <Separator />
          <p className="text-muted-foreground">
            Delivering to {order.name}, {order.address}, {order.suburb} {order.state} {order.postcode}
          </p>
        </CardContent>
      </Card>

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
