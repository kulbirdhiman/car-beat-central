import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge, fmtDateTime } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { DELIVERY_LABEL } from "@/lib/admin/model";
import { orderReference } from "@/lib/payment";
import { formatCents } from "@/lib/data";
import { getOrder } from "@/lib/server/orders";
import { PrintInvoiceButton } from "./PrintInvoiceButton";

export const metadata: Metadata = { title: "Invoice · CarBeat", robots: { index: false } };

export default async function AdminOrderInvoicePage(props: PageProps<"/admin/orders/[id]/invoice">) {
  const { id } = await props.params;
  const order = await getOrder(id);
  if (!order) notFound();
  const number = orderReference(order);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="print-hidden mb-5 flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href={`/admin/orders/${encodeURIComponent(id)}`}>Back to order</Link></Button>
        <PrintInvoiceButton />
      </div>

      <article className="invoice-print-root rounded-xl border bg-white p-6 text-zinc-950 shadow-sm sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div>
            <p className="font-display text-3xl font-extrabold tracking-tight">CAR<span className="text-primary">BEAT</span></p>
            <p className="mt-1 text-sm text-zinc-600">Vehicle accessories and installation</p>
          </div>
          <div className="text-right">
            <h1 className="font-display text-3xl font-bold">INVOICE</h1>
            <p className="mt-1 font-mono text-lg">{number}</p>
            <p className="mt-1 text-sm text-zinc-600">{fmtDateTime(order.createdAt)}</p>
            <div className="mt-2 flex justify-end"><OrderStatusBadge status={order.status} /></div>
          </div>
        </header>

        <section className="grid gap-6 border-b py-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Bill to</h2>
            <p className="font-semibold">{order.name}</p>
            {order.address && <p>{order.address}</p>}
            <p>{[order.suburb, order.state, order.postcode].filter(Boolean).join(" ")}</p>
            <p className="mt-2">{order.email}</p>
            {order.phone && <p>{order.phone}</p>}
          </div>
          <div className="sm:text-right">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Order details</h2>
            <p>Order date: {fmtDateTime(order.createdAt)}</p>
            <p>Delivery: {DELIVERY_LABEL[order.delivery]}</p>
            {order.source === "legacy" && <p className="mt-2 text-sm text-zinc-600">Imported from WooCommerce</p>}
          </div>
        </section>

        <section className="py-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-3 pr-3">Description</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3 text-right">Unit price</th>
                <th className="py-3 pl-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={`${item.productId}-${index}`} className="break-inside-avoid border-b border-zinc-200">
                  <td className="py-3 pr-3">{item.name}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{item.qty}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCents(item.unitPrice)}</td>
                  <td className="py-3 pl-3 text-right tabular-nums">{formatCents(item.unitPrice * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="ml-auto max-w-sm border-t border-zinc-300 pt-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd className="tabular-nums">{formatCents(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between gap-4"><dt>Discount</dt><dd className="tabular-nums">−{formatCents(order.discount)}</dd></div>}
            <div className="flex justify-between gap-4"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping ? formatCents(order.shipping) : "Free"}</dd></div>
            <div className="flex justify-between gap-4 border-t border-zinc-300 pt-3 text-lg font-bold"><dt>Total (AUD)</dt><dd className="tabular-nums">{formatCents(order.total)}</dd></div>
            {order.refundedTotal > 0 && <div className="flex justify-between gap-4 text-zinc-600"><dt>Refunded</dt><dd className="tabular-nums">−{formatCents(order.refundedTotal)}</dd></div>}
          </dl>
        </section>

        <footer className="mt-10 border-t pt-4 text-center text-xs text-zinc-500">
          <p>Thank you for your order.</p>
          <p className="mt-1">Prices are shown in Australian dollars unless noted otherwise.</p>
        </footer>
      </article>
    </div>
  );
}
