"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Empty, OrderStatusBadge, PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/data";
import { isOpenReturn } from "@/lib/returns";
import { orderTotal, type AdminOrder } from "@/lib/admin/model";
import { RefundDialog, ReturnRequests, type ReturnRefundPreset } from "../orders/Refunds";

export function ReturnsManager() {
  const { orders } = useAdminStore();
  const [refund, setRefund] = useState<{ order: AdminOrder; preset: ReturnRefundPreset } | null>(null);
  const rows = orders.filter((order) => order.returns.some(isOpenReturn));
  const requestCount = rows.reduce((total, order) => total + order.returns.filter(isOpenReturn).length, 0);

  return (
    <>
      <PageHeader
        title="Return requests"
        description={`${requestCount} open request${requestCount === 1 ? "" : "s"}. Review the customer’s reason, then approve or decline with a reply.`}
      />

      {rows.length === 0 ? (
        <Card><CardContent><Empty>There are no open return or cancellation requests.</Empty></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {rows.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="space-y-4">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                  <div className="min-w-0">
                    <Link href={`/admin/orders/${encodeURIComponent(order.id)}`} className="font-mono text-lg font-semibold hover:underline">
                      {order.number}
                    </Link>
                    <p className="mt-1 text-sm font-medium">{order.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer.email} · Remaining total {formatCents(orderTotal(order) - order.refunded)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/orders/${encodeURIComponent(order.id)}`}>View order</Link>
                    </Button>
                  </div>
                </header>
                <ReturnRequests order={order} onRefund={(preset) => setRefund({ order, preset })} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {refund && (
        <RefundDialog
          order={refund.order}
          preset={refund.preset}
          open
          onOpenChange={(open) => !open && setRefund(null)}
        />
      )}
    </>
  );
}
