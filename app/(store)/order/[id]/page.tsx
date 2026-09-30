import type { Metadata } from "next";
import { CircleCheck, Mail, Package, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/data";
import { DELIVERY_OPTIONS } from "@/lib/pricing";
import { getOrder } from "@/lib/server/orders";
import { ClearCart } from "./ClearCart";

export const metadata: Metadata = { title: "Order placed · CarBeat", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const order = getOrder((await props.params).id);
  if (!order) notFound();

  const reference = order.id.slice(0, 8).toUpperCase();

  return (
    <PageShell className="max-w-3xl">
      <ClearCart />
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className="mx-auto grid size-16 place-items-center rounded-lg bg-success/10 animate-in zoom-in duration-500">
          <CircleCheck className="size-8 text-success" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">Thanks, {order.name.split(" ")[0]}.</h1>
        <p className="mt-2 text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">#{reference}</span> is in. We&apos;ll email {order.email} with your payment link and tracking.
        </p>
      </div>

      <ol className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Mail, title: "Pay securely", body: "Check your inbox for a payment link." },
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
            <div key={i.product_id} className="flex justify-between gap-4">
              <span>
                {i.qty} × {i.name}
              </span>
              <span className="tabular-nums">{formatCents(i.unit_price * i.qty)}</span>
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
