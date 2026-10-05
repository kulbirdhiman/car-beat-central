"use client";

import { ArrowUpRight, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Empty, OrderStatusBadge, PageHeader, fmtDateTime } from "@/components/admin/ui";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LOW_STOCK, ORDER_STATUS_LABEL, orderTotal } from "@/lib/admin/model";
import { formatCents } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

export function Dashboard() {
  const { orders, products, departments, makes } = useAdminStore();

  const counted = orders.filter((o) => o.status !== "cancelled");
  const revenue = counted.reduce((sum, o) => sum + orderTotal(o), 0);
  const toShip = orders.filter((o) => o.status === "paid").length;
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
    { label: "Revenue (incl. GST)", value: formatCents(revenue), hint: `${counted.length} orders` },
    { label: "Average order", value: formatCents(counted.length ? Math.round(revenue / counted.length) : 0), hint: "Excludes cancelled" },
    { label: "Ready to ship", value: toShip.toLocaleString("en-AU"), hint: "Paid, not yet shipped", href: "/admin/orders?status=paid" },
    { label: "Catalogue", value: products.length.toLocaleString("en-AU"), hint: `${departments.length} departments · ${makes.length} makes · ${models} models` },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="How the store is tracking." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <CardTitle className="text-3xl! tabular-nums">{s.value}</CardTitle>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
              {s.href && (
                <CardAction>
                  <Link href={s.href} className="text-muted-foreground hover:text-foreground" aria-label={`View ${s.label.toLowerCase()}`}>
                    <ArrowUpRight className="size-4" />
                  </Link>
                </CardAction>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardAction>
              <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
                All orders →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
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
                {orders.slice(0, 6).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">
                      <Link href={`/admin/orders?open=${o.id}`} className="hover:underline">
                        {o.number}
                      </Link>
                    </TableCell>
                    <TableCell>{o.customer.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{fmtDateTime(o.createdAt)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCents(orderTotal(o))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((status) => (
                <li key={status} className="flex items-center justify-between py-2.5">
                  <OrderStatusBadge status={status} />
                  <Link href={`/admin/orders?status=${status}`} className="text-sm font-medium tabular-nums hover:underline">
                    {orders.filter((o) => o.status === status).length}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by department</CardTitle>
          </CardHeader>
          <CardContent>
            {deptRows.length === 0 ? (
              <Empty>No sales yet.</Empty>
            ) : (
              <ul className="space-y-3">
                {deptRows.map((d) => (
                  <li key={d.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{d.name}</span>
                      <span className="tabular-nums text-muted-foreground">{formatCents(d.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(d.revenue / maxDept) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {topProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="size-10 rounded-md object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{p.units} sold</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-amber-600" /> Low stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <Empty>Everything is well stocked.</Empty>
            ) : (
              <ul className="divide-y">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/products?edit=${p.id}`} className="min-w-0 truncate text-sm hover:underline">
                      {p.name}
                    </Link>
                    <span className={p.stock === 0 ? "text-sm font-medium text-destructive" : "text-sm tabular-nums text-amber-700 dark:text-amber-400"}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
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
