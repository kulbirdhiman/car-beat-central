import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/data";
import { orderReference } from "@/lib/payment";
import type { CustomerOrder } from "@/lib/server/account";

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { dateStyle: "medium", timeZone: "Australia/Sydney" });

/** One order in the customer's history: reference, date, status, what's in it and the total. */
export function OrderCard({ order }: { order: CustomerOrder }) {
  const units = order.items.reduce((n, i) => n + i.qty, 0);
  const names = order.items.map((i) => i.name);
  const summary = names.length > 2 ? `${names.slice(0, 2).join(", ")} and ${names.length - 2} more` : names.join(" and ");

  return (
    <li className="rounded-xl bg-card p-5 ring-1 ring-foreground/[0.07]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono font-semibold">#{orderReference(order.id)}</span>
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-muted-foreground">{fmtDate(order.createdAt)}</span>
        <span className="ml-auto font-semibold tabular-nums">{formatCents(order.total)}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {units} {units === 1 ? "item" : "items"}: {summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "pending_payment" && (
          <Button asChild size="sm">
            <Link href={`/order/${order.id}`}>Pay now</Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link href={`/order/${order.id}`}>
            View order <ArrowRight />
          </Link>
        </Button>
      </div>
    </li>
  );
}
