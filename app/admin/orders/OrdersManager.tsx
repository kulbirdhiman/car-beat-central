"use client";

import { Search, Truck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Empty, OrderStatusBadge, PageHeader, fmtDateTime } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DELIVERY_LABEL, ORDER_STATUS_LABEL, orderSubtotal, orderTotal, type AdminOrder } from "@/lib/admin/model";
import { formatCents } from "@/lib/data";
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
      <PageHeader title="Orders" description={`${orders.length} orders · ${orders.filter((o) => o.status === "paid").length} ready to ship.`} />

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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{openOrder && <OrderDetail order={openOrder} />}</SheetContent>
      </Sheet>
    </>
  );
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const { setOrderStatus } = useAdminStore();
  const subtotal = orderSubtotal(order);
  const total = orderTotal(order);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <span className="font-mono">{order.number}</span>
          <OrderStatusBadge status={order.status} />
        </SheetTitle>
        <SheetDescription>Placed {fmtDateTime(order.createdAt)}</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4">
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Customer</h3>
            <p className="text-sm font-medium">{order.customer.name}</p>
            <p className="text-sm">
              <a href={`mailto:${order.customer.email}`} className="hover:underline">
                {order.customer.email}
              </a>
            </p>
            <p className="text-sm">{order.customer.phone}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {order.delivery === "collect" ? "Billing address" : "Ship to"}
            </h3>
            <p className="text-sm">{order.shipTo.address}</p>
            <p className="text-sm">
              {order.shipTo.suburb} {order.shipTo.state} {order.shipTo.postcode}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{DELIVERY_LABEL[order.delivery]}</p>
          </div>
        </section>

        <Separator />

        <section>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Items</h3>
          <ul className="divide-y">
            {order.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  {i.name} <span className="text-muted-foreground">× {i.qty}</span>
                </span>
                <span className="tabular-nums">{formatCents(i.unitPrice * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
            <Line label="Subtotal" value={formatCents(subtotal)} />
            {order.discount > 0 && <Line label={`Discount${order.coupon ? ` (${order.coupon})` : ""}`} value={`−${formatCents(order.discount)}`} />}
            <Line label="Shipping" value={order.shipping ? formatCents(order.shipping) : "Free"} />
            <Line label="Total" value={formatCents(total)} strong />
            <Line label="Includes GST" value={formatCents(Math.round(total / 11))} muted />
          </dl>
          {order.payment && (
            <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
              Paid with PayPal {fmtDateTime(order.payment.paidAt)}
              <br />
              <span className="text-muted-foreground">Transaction </span>
              <span className="font-mono">{order.payment.paypalCaptureId}</span>
            </p>
          )}
        </section>

        <Separator />

        <section>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Status</h3>
          <Select value={order.status} onValueChange={(v) => setOrderStatus(order.id, v as OrderStatus)}>
            <SelectTrigger className="w-full" aria-label="Order status">
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
        </section>
      </div>

      {order.status === "paid" && (
        <SheetFooter>
          <Button onClick={() => setOrderStatus(order.id, "fulfilled")}>
            <Truck /> Mark as shipped
          </Button>
        </SheetFooter>
      )}
    </>
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
