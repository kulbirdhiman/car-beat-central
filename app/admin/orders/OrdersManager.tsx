"use client";

import { Check, Copy, ExternalLink, Pencil, Plus, Search, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Empty, OrderStatusBadge, PageHeader, fmtDateTime } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DELIVERY_LABEL, ORDER_STATUS_LABEL, orderSubtotal, orderTotal, type AdminOrder } from "@/lib/admin/model";
import { formatCents } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/payment";
import { CARRIER_KEYS, CARRIERS, trackingUrl, type Carrier } from "@/lib/shipping";
import type { OrderStatus } from "@/lib/types";

const ALL = "all";
const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

export function OrdersManager() {
  const { orders } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  // Status filter and open order live in the URL so the dashboard can link straight to them.
  const statusParam = searchParams.get("status");
  const status = statusParam && (STATUSES as string[]).includes(statusParam) ? (statusParam as OrderStatus) : ALL;
  const openOrder = orders.find((o) => o.id === searchParams.get("open")) ?? null;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const q = query.trim().toLowerCase();
  const rows = orders.filter(
    (o) =>
      (status === ALL || o.status === status) &&
      (!q || o.number.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q) || o.customer.email.toLowerCase().includes(q)),
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${orders.length} orders · ${orders.filter((o) => o.status === "paid").length} ready to ship.`}
        actions={
          <Button asChild>
            <Link href="/admin/orders/new">
              <Plus /> New invoice
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={status} onValueChange={(v) => setParam("status", v === ALL ? null : v)}>
              <TabsList className="flex-wrap">
                <TabsTrigger value={ALL}>All ({orders.length})</TabsTrigger>
                {STATUSES.map((s) => (
                  <TabsTrigger key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]} ({orders.filter((o) => o.status === s).length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order #, name or email" className="pl-8" aria-label="Search orders" />
            </div>
          </div>

          {rows.length === 0 ? (
            <Empty>No orders match.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden md:table-cell">Placed</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Delivery</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setParam("open", o.id)}>
                    <TableCell className="font-mono">
                      {/* A real button keeps the row reachable by keyboard; the row click is a mouse shortcut. */}
                      <button type="button" className="hover:underline" onClick={(e) => {
                          e.stopPropagation();
                          setParam("open", o.id);
                        }}>
                        {o.number}
                      </button>
                      {o.source === "invoice" && <span className="ml-2 font-sans text-xs text-muted-foreground">Invoice</span>}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{fmtDateTime(o.createdAt)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.shipTo.suburb}, {o.shipTo.state}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{DELIVERY_LABEL[o.delivery]}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{o.items.reduce((n, i) => n + i.qty, 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCents(orderTotal(o))}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={openOrder !== null} onOpenChange={(open) => !open && setParam("open", null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{openOrder && <OrderDetail key={openOrder.id} order={openOrder} />}</SheetContent>
      </Sheet>
    </>
  );
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const { setOrderStatus } = useAdminStore();
  const subtotal = orderSubtotal(order);
  const total = orderTotal(order);
  const pickup = order.delivery === "collect";
  const units = order.items.reduce((n, i) => n + i.qty, 0);

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <SheetTitle className="flex items-center gap-3">
          <span className="font-mono text-lg">{order.number}</span>
          <OrderStatusBadge status={order.status} />
          {order.source === "invoice" && <span className="text-xs font-normal text-muted-foreground">Invoice</span>}
        </SheetTitle>
        <SheetDescription>
          {order.source === "invoice" ? "Raised" : "Placed"} {fmtDateTime(order.createdAt)} · {formatCents(total)}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 p-4">
        {(order.status === "paid" || order.status === "fulfilled") && <Fulfilment order={order} />}

        <Panel title="Customer">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-0.5">
              <p className="font-medium">{order.customer.name}</p>
              <a href={`mailto:${order.customer.email}`} className="block truncate text-muted-foreground hover:text-foreground hover:underline">
                {order.customer.email}
              </a>
              <a href={`tel:${order.customer.phone}`} className="block text-muted-foreground hover:text-foreground hover:underline">
                {order.customer.phone}
              </a>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium">{pickup ? "Local pickup" : `${DELIVERY_LABEL[order.delivery]} delivery`}</p>
              <p className="text-muted-foreground">{order.shipTo.address}</p>
              <p className="text-muted-foreground">
                {order.shipTo.suburb} {order.shipTo.state} {order.shipTo.postcode}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title={`Items (${units})`}>
          <ul className="space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {i.name} <span className="text-muted-foreground">× {i.qty}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatCents(i.unitPrice * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
            <Line label="Subtotal" value={formatCents(subtotal)} muted />
            {order.discount > 0 && <Line label={`Discount${order.coupon ? ` (${order.coupon})` : ""}`} value={`−${formatCents(order.discount)}`} muted />}
            <Line label="Shipping" value={order.shipping ? formatCents(order.shipping) : "Free"} muted />
            <Line label="Total (incl. GST)" value={formatCents(total)} strong />
            <Line label="GST" value={formatCents(Math.round(total / 11))} muted />
          </dl>
        </Panel>

        <Panel title="Payment">
          {order.payment ? (
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">
                Paid with {order.payment.provider} · {fmtDateTime(order.payment.paidAt)}
              </p>
              <p className="text-muted-foreground">
                {order.payment.provider === "Afterpay" ? "Afterpay order " : "Transaction "}
                <span className="font-mono text-foreground">{order.payment.transactionId}</span>
              </p>
            </div>
          ) : order.status === "pending_payment" ? (
            <p className="text-sm text-muted-foreground">
              Awaiting payment by {order.paymentMethods.map((m) => PAYMENT_METHODS[m].toLowerCase()).join(", ")}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{order.status === "cancelled" ? "Not paid." : "Paid offline (bank transfer or in store)."}</p>
          )}
        </Panel>

        {order.note && (
          <Panel title="Note to customer">
            <p className="whitespace-pre-line text-sm">{order.note}</p>
          </Panel>
        )}

        <Panel title="Invoice link">
          <InvoiceLink orderId={order.id} />
        </Panel>
      </div>

      <SheetFooter className="border-t">
        <label htmlFor="order-status" className="text-xs font-medium text-muted-foreground">
          Change status
        </label>
        <Select value={order.status} onValueChange={(v) => setOrderStatus(order.id, v as OrderStatus)}>
          <SelectTrigger id="order-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SheetFooter>
    </>
  );
}

/** A titled block in the order panel. */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Shipping a paid order: pick the carrier and enter the tracking number, then mark it shipped.
 * Once shipped, shows the tracking (with a link to the carrier) and lets it be corrected.
 */
function Fulfilment({ order }: { order: AdminOrder }) {
  const { setOrderStatus } = useAdminStore();
  const shipped = order.status === "fulfilled";
  const pickup = order.delivery === "collect";
  const [editing, setEditing] = useState(false);
  const [carrier, setCarrier] = useState<Carrier>(order.shipment?.carrier ?? "auspost");
  const [trackingNumber, setTrackingNumber] = useState(order.shipment?.trackingNumber ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const number = trackingNumber.trim();
    if (!number && !pickup) return setError("Enter the tracking number.");
    if (number && !/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(number)) return setError("Tracking numbers can only have letters, numbers, spaces and dashes.");
    setError(null);
    setOrderStatus(order.id, "fulfilled", number ? { carrier, trackingNumber: number } : null);
    setEditing(false);
  }

  if (shipped && !editing) {
    const url = order.shipment && trackingUrl(order.shipment.carrier, order.shipment.trackingNumber);
    return (
      <Panel title={pickup ? "Picked up" : "Shipped"}>
        <div className="flex items-start justify-between gap-3 text-sm">
          <div className="min-w-0 space-y-0.5">
            {order.shipment ? (
              <>
                <p className="font-medium">{CARRIERS[order.shipment.carrier].name}</p>
                <p className="font-mono break-all">{order.shipment.trackingNumber}</p>
              </>
            ) : (
              <p className="text-muted-foreground">{pickup ? "Collected by the customer." : "No tracking number added."}</p>
            )}
            {order.shippedAt && <p className="text-xs text-muted-foreground">{fmtDateTime(order.shippedAt)}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            {url && (
              <Button asChild size="sm" variant="outline">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink /> Track
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil /> {order.shipment ? "Edit" : "Add tracking"}
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={shipped ? "Edit tracking" : pickup ? "Ready for pickup" : "Ship this order"}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="grid gap-1.5">
            <Label htmlFor="ship-carrier">Carrier</Label>
            <Select value={carrier} onValueChange={(v) => setCarrier(v as Carrier)}>
              <SelectTrigger id="ship-carrier" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARRIER_KEYS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CARRIERS[c].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ship-tracking">Tracking number{pickup && <span className="font-normal text-muted-foreground"> (optional)</span>}</Label>
            <Input
              id="ship-tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 33ABC1234567"
              autoComplete="off"
              maxLength={60}
              aria-invalid={!!error}
              className="font-mono"
            />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {shipped ? (
              <>
                <Check /> Save tracking
              </>
            ) : (
              <>
                <Truck /> {pickup ? "Mark as picked up" : "Mark as shipped"}
              </>
            )}
          </Button>
          {shipped && (
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Panel>
  );
}

/** The customer's order page, which doubles as the invoice they pay from. */
export function InvoiceLink({ orderId }: { orderId: string }) {
  const path = `/order/${orderId}`;
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Send this to the customer. They can view the invoice and pay from it.</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
              toast.success("Invoice link copied.");
            } catch {
              toast.error("Couldn't copy the link.");
            }
          }}
        >
          <Copy /> Copy link
        </Button>
        <Button asChild variant="outline">
          <a href={path} target="_blank" rel="noreferrer">
            <ExternalLink /> Open
          </a>
        </Button>
      </div>
    </div>
  );
}

function Line({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-1 text-base font-semibold" : ""} ${muted ? "text-muted-foreground" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
