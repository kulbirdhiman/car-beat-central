"use client";

import { Check, Copy, Download, ExternalLink, Loader2, Mail, Pencil, Plus, Save, Search, Trash2, Truck, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_LABEL, ORDER_STATUS_LABEL, orderSubtotal, orderTotal, type AdminOrder } from "@/lib/admin/model";
import { formatCents } from "@/lib/data";
import { matchesOrderReference, PAYMENT_METHODS } from "@/lib/payment";
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
const STATUSES = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).filter((status) => status !== "paid");
const matchesStatus = (order: AdminOrder, status: OrderStatus) =>
  status === "processing" ? order.status === "processing" || order.status === "paid" : order.status === status;

const openReturn = (o: AdminOrder) => o.returns.find(isOpenReturn);

export function OrdersManager() {
  const { orders } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  // Status filter and open order live in the URL so the dashboard can link straight to them.
  const statusParam = searchParams.get("status");
  const status = statusParam === RETURNS || statusParam === DISPATCH ? statusParam : statusParam === "paid" ? "processing" : statusParam && (STATUSES as string[]).includes(statusParam) ? (statusParam as OrderStatus) : ALL;

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
      (status === ALL || (status !== RETURNS && status !== DISPATCH && matchesStatus(o, status)) || (status === RETURNS && !!openReturn(o)) || (status === DISPATCH && ["processing", "paid", "confirmed", "preparing"].includes(o.status))) &&
      (!q || matchesOrderReference(o, q) || o.customer.name.toLowerCase().includes(q) || o.customer.email.toLowerCase().includes(q)),
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
                    {ORDER_STATUS_LABEL[s]} ({orders.filter((o) => matchesStatus(o, s)).length})
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
                    <TableCell className="min-w-56 whitespace-normal">
                      <div className="font-medium">{o.customer.name}</div>
                      {o.customer.email && (
                        <a href={`mailto:${o.customer.email}`} className="block break-all text-xs text-muted-foreground hover:underline">
                          {o.customer.email}
                        </a>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {[o.shipTo.address, [o.shipTo.suburb, o.shipTo.state, o.shipTo.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "No address provided"}
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
  const shippingAddress = [order.customer.name, order.shipTo.address, order.shipTo.suburb, order.shipTo.state, order.shipTo.postcode].filter(Boolean).join("\n");
  const [refunding, setRefunding] = useState<{ preset: Parameters<typeof RefundDialog>[0]["preset"] } | null>(null);

  return (
    <>
      {standalone ? (
        <header className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-mono text-muted-foreground">
                {order.source === "invoice" ? "Invoice order" : order.source === "legacy" ? "Imported order" : "Customer order"}
              </p>
              <OrderStatusBadge status={order.status} />
            </div>
            <h1 className="mt-2 break-all font-mono text-3xl font-bold tracking-tight">{order.number}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{order.source === "invoice" ? "Raised" : "Placed"} {fmtDateTime(order.createdAt)}</p>
          </div>
          <div className="rounded-xl bg-secondary/70 px-5 py-4 sm:min-w-48 sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order total</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{formatCents(total)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{units} item{units === 1 ? "" : "s"}</p>
          </div>
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

      <div className={cn("space-y-5", standalone ? "pt-0" : "p-4")}>
        <ReturnRequests order={order} onRefund={(preset) => setRefunding({ preset })} />

        {(["processing", "paid", "confirmed", "preparing", "fulfilled", "completed"].includes(order.status)) && <Fulfilment order={order} />}

        <div className={cn("grid gap-4", standalone && "xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,1fr)] xl:items-start")}>
          <div className="space-y-4">
            <Panel title={`Items (${units})`}>
              <ul className="space-y-3 text-sm">
                {order.items.map((i) => (
                  <li key={i.productId} className="flex justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block font-medium">{i.name}</span>
                      <span className="text-muted-foreground">Qty {i.qty} · {formatCents(i.unitPrice)} each</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">{formatCents(i.unitPrice * i.qty)}</span>
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
            <Refunds order={order} onRefund={() => setRefunding({ preset: null })} />
            {order.note && <Panel title="Note to customer"><p className="whitespace-pre-line text-sm">{order.note}</p></Panel>}
          </div>

          <aside className="space-y-4">
            <Panel title="Customer details">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{order.customer.name}</p>
                <a href={`mailto:${order.customer.email}`} className="block break-all text-muted-foreground hover:text-foreground hover:underline">{order.customer.email}</a>
                <a href={`tel:${order.customer.phone}`} className="block text-muted-foreground hover:text-foreground hover:underline">{order.customer.phone}</a>
              </div>
            </Panel>

            <Panel title={pickup ? "Collection details" : "Shipping address"}>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{pickup ? "Local pickup" : `${DELIVERY_LABEL[order.delivery]} delivery`}</p>
                  {!pickup && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shippingAddress);
                          toast.success("Shipping address copied.");
                        } catch {
                          toast.error("Couldn't copy the shipping address.");
                        }
                      }}
                    >
                      <Copy /> Copy address
                    </Button>
                  )}
                </div>
                {pickup ? (
                  <p className="text-muted-foreground">Customer will collect this order.</p>
                ) : (
                  <address className="space-y-0.5 not-italic">
                    <p className="font-medium">{order.customer.name}</p>
                    <p>{order.shipTo.address}</p>
                    <p>{order.shipTo.suburb}</p>
                    <p>{[order.shipTo.state, order.shipTo.postcode].filter(Boolean).join(" ")}</p>
                  </address>
                )}
              </div>
            </Panel>

            {standalone && <InternalOrderNotes key={order.id} orderId={order.id} initialNote={order.internalNote} />}

            <Panel title="Payment">
              {order.source === "legacy" ? (
                <p className="text-sm text-muted-foreground">Payment details remain in the original WooCommerce records.</p>
              ) : order.payment ? (
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium">Paid with {order.payment.provider} · {fmtDateTime(order.payment.paidAt)}</p>
                  <p className="break-all text-muted-foreground">
                    {order.payment.provider === "Afterpay" ? "Afterpay order " : "Transaction "}
                    <span className="font-mono text-foreground">{order.payment.transactionId}</span>
                  </p>
                </div>
              ) : order.status === "pending_payment" ? (
                <p className="text-sm text-muted-foreground">Awaiting payment by {order.paymentMethods.map((m) => PAYMENT_METHODS[m].toLowerCase()).join(", ")}.</p>
              ) : (
                <p className="text-sm text-muted-foreground">{order.status === "cancelled" && !order.paidAt ? "Not paid." : "Paid offline (bank transfer or in store)."}</p>
              )}
            </Panel>

            {(order.status === "pending_payment" || ["processing", "paid", "confirmed", "preparing"].includes(order.status) || order.status === "cancelled") && (
              <Panel title="Order actions">
                <div className="grid gap-2">
                  {!order.paidAt && order.status === "pending_payment" && (
                    <Button type="button" variant="outline" className="w-full" onClick={() => setOrderStatus(order.id, "processing")}>
                      <Check /> Mark payment received
                    </Button>
                  )}
                  {order.status === "pending_payment" && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        if (!confirm(`Delete unpaid order ${order.number}? This cannot be undone.`)) return;
                        try {
                          await deleteOrder(order.id);
                          router.push("/admin/orders");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Couldn't delete this order.");
                        }
                      }}
                    >
                      <Trash2 /> Delete unpaid order
                    </Button>
                  )}
                  {(["processing", "paid", "confirmed", "preparing"].includes(order.status)) && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        if (order.payment && order.refunded < total && !confirm("Cancelling doesn't refund the payment. Use Refund for that. Cancel anyway?")) return;
                        setOrderStatus(order.id, "cancelled");
                      }}
                    >
                      <X /> Cancel order
                    </Button>
                  )}
                  {order.status === "cancelled" && (
                    <Button type="button" variant="outline" className="w-full" onClick={() => setOrderStatus(order.id, order.paidAt ? "processing" : "pending_payment")}>
                      Reinstate order
                    </Button>
                  )}
                </div>
              </Panel>
            )}

            <Panel title="Invoice"><InvoiceLink orderId={order.id} email={order.customer.email} orderNumber={order.number} total={total} items={order.items} legacy={order.source === "legacy"} /></Panel>
          </aside>
        </div>
      </div>

      <RefundDialog order={order} preset={refunding?.preset ?? null} open={refunding !== null} onOpenChange={(open) => !open && setRefunding(null)} />

    </>
  );
}

/** A titled block in the order panel. */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function InternalOrderNotes({ orderId, initialNote }: { orderId: string; initialNote: string }) {
  const { saveOrderInternalNote } = useAdminStore();
  const notes = readInternalNotes(initialNote);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const text = note.trim();
    if (!text) return;
    setSaving(true);
    try {
      await saveOrderInternalNote(orderId, text);
      setNote("");
      toast.success("Internal note added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the internal note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Internal notes">
      <p className="mb-3 text-xs text-muted-foreground">Private staff notes. Customers cannot see these.</p>
      {notes.length > 0 && (
        <ol className="mb-4 space-y-3">
          {notes.map((entry, index) => (
            <li key={`${entry.createdAt}-${index}`} className="rounded-lg bg-muted/60 p-3">
              <p className="whitespace-pre-wrap text-sm">{entry.text}</p>
              {entry.createdAt && <p className="mt-2 text-xs text-muted-foreground">{fmtDateTime(entry.createdAt)}</p>}
            </li>
          ))}
        </ol>
      )}
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} rows={3} placeholder="Write a new note…" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{note.length}/5000</span>
        <Button size="sm" onClick={() => void save()} disabled={saving || !note.trim()}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Add note
        </Button>
      </div>
    </Panel>
  );
}

function readInternalNotes(value: string): { text: string; createdAt: string }[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const notes = parsed.filter((entry): entry is { text: string; createdAt: string } =>
        !!entry && typeof entry === "object" && typeof entry.text === "string" && typeof entry.createdAt === "string",
      );
      if (notes.length) return notes;
    }
  } catch {
    // Display notes saved before the history format as one legacy note.
  }
  return [{ text: value, createdAt: "" }];
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
export function InvoiceLink({ orderId, email, orderNumber, total, items, legacy = false }: { orderId: string; email: string; orderNumber: string; total: number; items: AdminOrder["items"]; legacy?: boolean }) {
  const path = `/order/${orderId}`;
  function emailInvoice() {
    const invoiceUrl = new URL(path, window.location.origin).href;
    const itemLines = items.map((item) => `${item.name} × ${item.qty} — ${formatCents(item.unitPrice * item.qty)}`).join("\n");
    const body = [
      `Hi ${email},`,
      "",
      `Here is your invoice for order ${orderNumber}.`,
      itemLines,
      `Total: ${formatCents(total)}`,
      ...(!legacy ? ["", `View your full order: ${invoiceUrl}`] : []),
      "",
      "Thank you,",
      "CarBeat",
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Invoice for order ${orderNumber}`)}&body=${encodeURIComponent(body)}`;
  }
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">{legacy ? "Prepare an invoice summary email for this imported order." : "Email the customer a link to their order, or print a PDF copy."}</p>
      <Button type="button" className="mb-2 w-full" onClick={emailInvoice}>
        <Mail /> Email invoice
      </Button>
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
