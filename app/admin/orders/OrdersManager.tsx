"use client";

import { Check, Copy, Download, ExternalLink, Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
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
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DELIVERY_LABEL, ORDER_STATUS_LABEL, orderSubtotal, orderTotal, type AdminOrder } from "@/lib/admin/model";
import { formatCents } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/payment";
import { CARRIER_KEYS, CARRIERS, trackingUrl, type Carrier } from "@/lib/shipping";
import { RETURN_KIND_LABEL, isOpenReturn } from "@/lib/returns";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RefundDialog, Refunds, ReturnRequests } from "./Refunds";

const ALL = "all";
/** A filter for orders with an open cancellation or return request. */
const RETURNS = "returns";
/** Paid orders which still need dispatch work. */
const DISPATCH = "dispatch";
const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

const openReturn = (o: AdminOrder) => o.returns.find(isOpenReturn);

export function OrdersManager() {
  const { orders } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  // Status filter and open order live in the URL so the dashboard can link straight to them.
  const statusParam = searchParams.get("status");
  const status = statusParam === RETURNS || statusParam === DISPATCH ? statusParam : statusParam && (STATUSES as string[]).includes(statusParam) ? (statusParam as OrderStatus) : ALL;

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
      (status === ALL || o.status === status || (status === RETURNS && !!openReturn(o)) || (status === DISPATCH && ["processing", "paid", "confirmed", "preparing"].includes(o.status))) &&
      (!q || o.number.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q) || o.customer.email.toLowerCase().includes(q)),
  );

  function exportOrders() {
    const columns = ["Order", "Placed", "Customer", "Email", "Phone", "Status", "Delivery", "Items", "Subtotal (AUD)", "Discount (AUD)", "Shipping (AUD)", "Total (AUD)"];
    const csvCell = (value: string | number) => {
      let text = String(value);
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const csv = [columns, ...rows.map((o) => [o.number, o.createdAt, o.customer.name, o.customer.email, o.customer.phone, ORDER_STATUS_LABEL[o.status], DELIVERY_LABEL[o.delivery], o.items.map((i) => `${i.name} × ${i.qty}`).join("; "), (orderSubtotal(o) / 100).toFixed(2), (o.discount / 100).toFixed(2), (o.shipping / 100).toFixed(2), (orderTotal(o) / 100).toFixed(2)])]
      .map((line) => line.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `carbeat-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${orders.length} orders · ${orders.filter((o) => ["processing", "paid", "confirmed", "preparing"].includes(o.status)).length} in dispatch · ${orders.filter(openReturn).length} open returns.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportOrders} disabled={!rows.length}><Download /> Export CSV</Button>
            <Button asChild><Link href="/admin/orders/new"><Plus /> New invoice</Link></Button>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={status} onValueChange={(v) => setParam("status", v === ALL ? null : v)}>
              <TabsList className="flex-wrap">
                <TabsTrigger value={ALL}>All ({orders.length})</TabsTrigger>
                <TabsTrigger value={DISPATCH}>Dispatch ({orders.filter((o) => ["processing", "paid", "confirmed", "preparing"].includes(o.status)).length})</TabsTrigger>
                {STATUSES.map((s) => (
                  <TabsTrigger key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]} ({orders.filter((o) => o.status === s).length})
                  </TabsTrigger>
                ))}
                <TabsTrigger value={RETURNS}>Returns ({orders.filter(openReturn).length})</TabsTrigger>
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
                  <TableHead className="hidden xl:table-cell">Placed</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden xl:table-cell">Delivery</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">
                      <Link href={`/admin/orders/${encodeURIComponent(o.id)}`} className="hover:underline">
                        {o.number}
                      </Link>
                      {o.source === "invoice" && <span className="ml-2 font-sans text-xs text-muted-foreground">Invoice</span>}
                      {o.source === "legacy" && <span className="ml-2 font-sans text-xs text-muted-foreground">Imported</span>}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{fmtDateTime(o.createdAt)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.shipTo.suburb}, {o.shipTo.state}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{DELIVERY_LABEL[o.delivery]}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{o.items.reduce((n, i) => n + i.qty, 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCents(orderTotal(o))}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                      {openReturn(o) && (
                        <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-400">{RETURN_KIND_LABEL[openReturn(o)!.kind]} requested</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </>
  );
}

export function OrderDetail({ order: initialOrder, standalone = false }: { order: AdminOrder; standalone?: boolean }) {
  const store = useAdminStore();
  const router = useRouter();
  const order = store.orders.find((item) => item.id === initialOrder.id) ?? initialOrder;
  const { setOrderStatus, deleteOrder } = store;
  const subtotal = orderSubtotal(order);
  const total = orderTotal(order);
  const pickup = order.delivery === "collect";
  const units = order.items.reduce((n, i) => n + i.qty, 0);
  const [refunding, setRefunding] = useState<{ preset: Parameters<typeof RefundDialog>[0]["preset"] } | null>(null);

  return (
    <>
      {standalone ? (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {order.source === "invoice" ? "Invoice order" : order.source === "legacy" ? "Imported order" : "Order"}
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold">{order.number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{order.source === "invoice" ? "Raised" : "Placed"} {fmtDateTime(order.createdAt)} · {formatCents(total)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </header>
      ) : (
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="flex items-center gap-3">
            <span className="font-mono text-lg">{order.number}</span>
            <OrderStatusBadge status={order.status} />
            {order.source === "invoice" && <span className="text-xs font-normal text-muted-foreground">Invoice</span>}
            {order.source === "legacy" && <span className="text-xs font-normal text-muted-foreground">Imported from WooCommerce</span>}
          </SheetTitle>
          <SheetDescription>
            {order.source === "invoice" ? "Raised" : "Placed"} {fmtDateTime(order.createdAt)} · {formatCents(total)}
          </SheetDescription>
        </SheetHeader>
      )}

      <div className={cn("space-y-4", standalone ? "p-5 sm:p-6" : "p-4")}>
        <ReturnRequests order={order} onRefund={(preset) => setRefunding({ preset })} />

        {(["processing", "paid", "confirmed", "preparing", "fulfilled", "completed"].includes(order.status)) && <Fulfilment order={order} />}

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
            {order.refunded > 0 && <Line label="Refunded" value={`−${formatCents(order.refunded)}`} muted />}
          </dl>
        </Panel>

        <Panel title="Payment">
          {order.source === "legacy" ? (
            <p className="text-sm text-muted-foreground">Payment details remain in the original WooCommerce records.</p>
          ) : order.payment ? (
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
            <p className="text-sm text-muted-foreground">{order.status === "cancelled" && !order.paidAt ? "Not paid." : "Paid offline (bank transfer or in store)."}</p>
          )}
        </Panel>

        <Refunds order={order} onRefund={() => setRefunding({ preset: null })} />

        {order.note && (
          <Panel title="Note to customer">
            <p className="whitespace-pre-line text-sm">{order.note}</p>
          </Panel>
        )}

        <Panel title="Invoice"><InvoiceLink orderId={order.id} legacy={order.source === "legacy"} /></Panel>
      </div>

      <RefundDialog order={order} preset={refunding?.preset ?? null} open={refunding !== null} onOpenChange={(open) => !open && setRefunding(null)} />

      <div className={cn("flex flex-col gap-2 border-t p-4", standalone ? "sm:flex-row sm:justify-end sm:p-6" : "mt-auto")}>
        {!order.paidAt && order.status === "pending_payment" && (
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              if (!confirm(`Delete unpaid order ${order.number}? This cannot be undone.`)) return;
              try { await deleteOrder(order.id); router.push("/admin/orders"); }
              catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't delete this order."); }
            }}
          >
            <Trash2 /> Delete order
          </Button>
        )}
        {order.status === "pending_payment" && (
          <Button type="button" variant="outline" className="w-full" onClick={() => setOrderStatus(order.id, "paid")}>
            Mark payment received
          </Button>
        )}
        {(["processing", "paid", "confirmed", "preparing"].includes(order.status)) && (
          <Button type="button" variant="destructive" className="w-full" onClick={() => {
            if (order.payment && order.refunded < total && !confirm("Cancelling doesn't refund the payment. Use Refund for that. Cancel anyway?")) return;
            setOrderStatus(order.id, "cancelled");
          }}>
            Cancel order
          </Button>
        )}
        {order.status === "cancelled" && (
          <Button type="button" variant="outline" className="w-full" onClick={() => setOrderStatus(order.id, order.paidAt ? "paid" : "pending_payment")}>
            Reinstate order
          </Button>
        )}
      </div>
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
  const shipped = order.status === "fulfilled" || order.status === "completed";
  const completed = order.status === "completed";
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
    setOrderStatus(order.id, completed ? "completed" : "fulfilled", number ? { carrier, trackingNumber: number } : null);
    setEditing(false);
  }

  if (shipped && !editing) {
    const url = order.shipment && trackingUrl(order.shipment.carrier, order.shipment.trackingNumber);
    return (
      <Panel title={completed ? "Order completed" : pickup ? "Picked up" : "Shipped"}>
        <DispatchSteps active={completed ? 4 : 3} />
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
            {!completed && <Button size="sm" onClick={() => setOrderStatus(order.id, "completed")}><Check /> Complete order</Button>}
          </div>
        </div>
      </Panel>
    );
  }

  if (order.status === "processing" || order.status === "paid" || order.status === "confirmed") {
    const confirmed = order.status === "confirmed";
    const activeStep = confirmed ? 1 : 0;
    return (
      <Panel title="Dispatch workflow">
        <DispatchSteps active={activeStep} />
        <Button className="w-full" onClick={() => setOrderStatus(order.id, confirmed ? "preparing" : "confirmed")}>
          <Check /> {confirmed ? "Start processing" : "Confirm order"}
        </Button>
      </Panel>
    );
  }

  return (
    <Panel title={shipped ? "Edit tracking" : pickup ? "Ready for pickup" : "Ship this order"}>
      <DispatchSteps active={shipped ? (completed ? 4 : 3) : 2} />
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

function DispatchSteps({ active }: { active: number }) {
  return (
    <ol className="mb-4 grid grid-cols-4 gap-1 text-center text-[11px] sm:text-xs">
      {["Confirm", "Process", "Ship", "Complete"].map((step, i) => (
        <li key={step} className={cn("rounded-md px-1 py-2", i < active ? "bg-success/10 font-semibold text-success" : i === active ? "bg-primary/10 font-semibold text-primary" : "bg-muted text-muted-foreground")}>{i + 1}. {step}</li>
      ))}
    </ol>
  );
}

/** The customer's order page, which doubles as the invoice they pay from. */
export function InvoiceLink({ orderId, legacy = false }: { orderId: string; legacy?: boolean }) {
  const path = `/order/${orderId}`;
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">{legacy ? "Print or save a copy of this imported order as a PDF." : "Send the order page to the customer, or print/save a PDF invoice."}</p>
      {!legacy && <div className="mb-2 flex gap-2">
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
      </div>}
      <Button asChild variant="outline" className="w-full">
        <Link href={`/admin/orders/${orderId}/invoice`} target="_blank"><Download /> Print / save as PDF</Link>
      </Button>
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
