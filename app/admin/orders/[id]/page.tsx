import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { OrderDetail } from "../OrdersManager";
import { Button } from "@/components/ui/button";
import { listAdminOrders } from "@/lib/server/orders";

export const metadata: Metadata = { title: "Order details · Admin · CarBeat", robots: { index: false } };

export default async function AdminOrderDetailsPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  if (!/^[a-z0-9-]{1,64}$/i.test(id)) notFound();
  const [order] = await listAdminOrders({ id, limit: 1 });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/admin/orders"><ArrowLeft /> All orders</Link></Button>
        <Button asChild variant="outline"><Link href={`/admin/orders/${encodeURIComponent(id)}/invoice`}><FileText /> View invoice</Link></Button>
      </div>
      <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <OrderDetail order={order} standalone />
      </article>
    </div>
  );
}
