"use client";

import { ArrowUpRight, ChevronRight, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Empty, OrderStatusBadge, PageHeader, fmtDateTime } from "@/components/admin/ui";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LOW_STOCK, ORDER_STATUS_LABEL, orderTotal } from "@/lib/admin/model";
import { formatCents } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

const storeDateFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type DatePreset = "all" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "last_year" | "custom";

const shiftDate = (day: string, amount: number) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

function presetRange(preset: Exclude<DatePreset, "all" | "custom">, today: string) {
  const date = new Date(`${today}T00:00:00Z`);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const weekStart = shiftDate(today, -((date.getUTCDay() + 6) % 7));
  switch (preset) {
    case "today": return { from: today, to: today };
    case "yesterday": return { from: shiftDate(today, -1), to: shiftDate(today, -1) };
    case "this_week": return { from: weekStart, to: today };
    case "last_week": return { from: shiftDate(weekStart, -7), to: shiftDate(weekStart, -1) };
    case "this_month": return { from: `${today.slice(0, 7)}-01`, to: today };
    case "last_month": return {
      from: new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10),
      to: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
    };
    case "this_year": return { from: `${year}-01-01`, to: today };
    case "last_year": return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    default: return { from: today, to: today };
  }
}

function storeDate(iso: string) {
  // Imported WooCommerce timestamps are naive UTC; app-created dates already carry a timezone.
  const value = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(iso) ? `${iso.replace(" ", "T")}Z` : iso;
  const parts = Object.fromEntries(storeDateFormatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function Dashboard() {
  const router = useRouter();
  const { orders, products, departments, makes } = useAdminStore();
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const today = storeDate(new Date().toISOString());
  const selectedRange = datePreset === "all"
    ? { from: "", to: "" }
    : datePreset === "custom"
      ? { from: customFrom, to: customTo }
      : presetRange(datePreset, today);
  const { from: dateFrom, to: dateTo } = selectedRange;

  const validRange = !dateFrom || !dateTo || dateFrom <= dateTo;
  const dateOrders = validRange ? orders.filter((o) => {
    const date = storeDate(o.createdAt);
    return (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
  }) : [];

  const counted = dateOrders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  // Less partial refunds; fully refunded orders are left out above.
  const revenue = counted.reduce((sum, o) => sum + orderTotal(o) - o.refunded, 0);
  const toShip = dateOrders.filter((o) => ["processing", "paid", "confirmed", "preparing"].includes(o.status)).length;
  const lowStock = products.filter((p) => p.status === "active" && p.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock);
  const models = makes.reduce((n, m) => n + m.models.length, 0);

  // Units sold per product and revenue per department, from non-cancelled orders.
  const unitsByProduct = new Map<string, number>();
  const revenueByDept = new Map<string, number>();
  for (const o of counted) {
    for (const i of o.items) {
      unitsByProduct.set(i.productId, (unitsByProduct.get(i.productId) ?? 0) + i.qty);
      const dept = products.find((p) => p.id === i.productId)?.departmentId;
      if (dept) revenueByDept.set(dept, (revenueByDept.get(dept) ?? 0) + i.unitPrice * i.qty);
    }
  }
  const topProducts = [...unitsByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .flatMap(([id, units]) => {
      const p = products.find((x) => x.id === id);
      return p ? [{ ...p, units }] : [];
    });
  const deptRows = departments
    .map((d) => ({ ...d, revenue: revenueByDept.get(d.id) ?? 0 }))
    .filter((d) => d.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
  const maxDept = Math.max(1, ...deptRows.map((d) => d.revenue));

  const stats = [
    { label: "Revenue (incl. GST)", value: formatCents(revenue), hint: `${counted.length} orders`, href: "/admin/orders" },
    { label: "Average order", value: formatCents(counted.length ? Math.round(revenue / counted.length) : 0), hint: "Excludes cancelled and refunded", href: "/admin/orders" },
    { label: "In dispatch", value: toShip.toLocaleString("en-AU"), hint: "Paid orders to confirm, process or ship", href: "/admin/orders?status=dispatch" },
    { label: "Catalogue", value: products.length.toLocaleString("en-AU"), hint: `${departments.length} departments · ${makes.length} makes · ${models} models`, href: "/admin/products" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How the store is tracking. Order figures follow the selected date range."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Select value={datePreset} onValueChange={(value) => setDatePreset(value as DatePreset)}>
              <SelectTrigger className="w-44" aria-label="Dashboard date range"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This week</SelectItem>
                <SelectItem value="last_week">Last week</SelectItem>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="last_month">Last month</SelectItem>
                <SelectItem value="this_year">This year</SelectItem>
                <SelectItem value="last_year">Last year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {datePreset === "custom" && <>
              <label className="grid gap-1 text-xs text-muted-foreground">From<Input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} aria-label="Filter dashboard from date" className="w-40" /></label>
              <label className="grid gap-1 text-xs text-muted-foreground">To<Input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} aria-label="Filter dashboard to date" className="w-40" /></label>
            </>}
          </div>
        }
      />
      {!validRange && <p role="alert" className="-mt-5 mb-5 text-sm text-destructive">Start date must be before the end date.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Card size="sm" className="h-full transition-colors hover:bg-muted/60">
            <CardHeader>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <CardTitle className="text-3xl! tabular-nums">{s.value}</CardTitle>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
              <CardAction>
                <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
          </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle><Link href="/admin/orders" className="hover:underline">Recent orders</Link></CardTitle>
            <CardAction>
              <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
                All orders →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {dateOrders.length === 0 ? <Empty>No orders in this date range.</Empty> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Placed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dateOrders.slice(0, 6).map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={(event) => {
                      if (event.target instanceof Element && event.target.closest("a, button")) return;
                      if (window.getSelection()?.toString()) return;
                      router.push(`/admin/orders/${encodeURIComponent(o.id)}`);
                    }}
                  >
                    <TableCell className="font-mono">
                      <Link href={`/admin/orders/${encodeURIComponent(o.id)}`} className="hover:underline">
                        {o.number}
                      </Link>
                    </TableCell>
                    <TableCell><Link href={`/admin/orders/${encodeURIComponent(o.id)}`} className="block hover:underline">{o.customer.name}</Link></TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell"><Link href={`/admin/orders/${encodeURIComponent(o.id)}`} className="block hover:underline">{fmtDateTime(o.createdAt)}</Link></TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/orders?status=${o.status === "paid" ? "processing" : o.status}`}
                        aria-label={`View ${ORDER_STATUS_LABEL[o.status].toLowerCase()} orders`}
                        className="inline-flex rounded-full transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <OrderStatusBadge status={o.status} />
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums"><Link href={`/admin/orders/${encodeURIComponent(o.id)}`} className="block hover:underline">{formatCents(orderTotal(o))}</Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><Link href="/admin/orders" className="hover:underline">Orders by status</Link></CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).filter((status) => status !== "paid").map((status) => (
                <li key={status}>
                  <Link
                    href={`/admin/orders?status=${status}`}
                    aria-label={`View ${ORDER_STATUS_LABEL[status].toLowerCase()} orders`}
                    className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <OrderStatusBadge status={status} />
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {dateOrders.filter((o) => o.status === status || (status === "processing" && o.status === "paid")).length}
                      </span>
                      <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><Link href="/admin/departments" className="hover:underline">Sales by department</Link></CardTitle>
          </CardHeader>
          <CardContent>
            {deptRows.length === 0 ? (
              <Empty>No sales yet.</Empty>
            ) : (
              <ul className="space-y-3">
                {deptRows.map((d) => (
                  <li key={d.id}>
                    <Link href={`/admin/products?department=${encodeURIComponent(d.id)}`} className="block rounded-lg p-2 -m-2 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{d.name}</span>
                      <span className="tabular-nums text-muted-foreground">{formatCents(d.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(d.revenue / maxDept) * 100}%` }} />
                    </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><Link href="/admin/products" className="hover:underline">Top sellers</Link></CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? <Empty>No catalogue sales in this date range.</Empty> : <ul className="divide-y">
              {topProducts.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${encodeURIComponent(p.id)}/edit`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 -mx-2 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="size-10 rounded-md object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{p.units} sold</span>
                  </Link>
                </li>
              ))}
            </ul>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link href="/admin/products" className="flex items-center gap-2 hover:underline"><TriangleAlert className="size-4 text-amber-600" /> Low stock</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <Empty>Everything is well stocked.</Empty>
            ) : (
              <ul className="divide-y">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${encodeURIComponent(p.id)}/edit`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 -mx-2 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring">
                      <span className="min-w-0 truncate text-sm">{p.name}</span>
                    <span className={p.stock === 0 ? "text-sm font-medium text-destructive" : "text-sm tabular-nums text-amber-700 dark:text-amber-400"}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
