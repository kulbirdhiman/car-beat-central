import { Package } from "lucide-react";
import Link from "next/link";
import { OrderCard } from "@/components/account/OrderCard";
import { Button } from "@/components/ui/button";
import { listCustomerOrders } from "@/lib/server/account";
import { requireCustomer } from "@/lib/server/customer";

export const metadata = { title: "My orders · CarBeat", robots: { index: false } };

export default async function OrdersPage() {
  const customer = await requireCustomer("/account/orders");
  const orders = await listCustomerOrders(customer);

  return (
    <>
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Orders</h1>
      <p className="mt-2 text-muted-foreground">Every order placed with {customer.emails.length > 1 ? "your verified emails" : customer.email}, newest first.</p>
      {orders.length ? (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed p-12 text-center">
          <Package className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 font-display text-2xl font-bold">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">When you place an order, you can track it here.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/shop">Browse parts</Link>
          </Button>
        </div>
      )}
    </>
  );
}
