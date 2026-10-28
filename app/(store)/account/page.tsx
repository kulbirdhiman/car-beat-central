import { ArrowRight, CalendarCheck, Clock, MapPin, Package, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { OrderCard } from "@/components/account/OrderCard";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/data";
import { getDefaultAddress, listCustomerOrders } from "@/lib/server/account";
import { requireCustomer } from "@/lib/server/customer";

export const metadata = { title: "My account · CarBeat", robots: { index: false } };

export default async function AccountDashboard() {
  const customer = await requireCustomer("/account");
  const [orders, address] = await Promise.all([listCustomerOrders(customer), getDefaultAddress(customer.id)]);
  const live = orders.filter((o) => o.status !== "cancelled");
  const unpaid = orders.filter((o) => o.status === "pending_payment");
  const spent = orders.filter((o) => ["processing", "paid", "confirmed", "preparing", "fulfilled", "completed"].includes(o.status)).reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { icon: Package, label: "Orders", value: String(live.length) },
    { icon: Wallet, label: "Total spent", value: formatCents(spent) },
    { icon: Clock, label: "Awaiting payment", value: String(unpaid.length) },
  ];

  return (
    <>
      <h1 className="font-display text-4xl font-bold sm:text-5xl">G&apos;day, {customer.firstName}.</h1>
      <p className="mt-2 text-muted-foreground">Your orders, addresses and account details, all in one place.</p>

      {unpaid.length > 0 && (
        <Link
          href={`/order/${unpaid[0].id}`}
          className="mt-6 flex items-center gap-3 rounded-xl bg-primary/10 p-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <Clock className="size-5 shrink-0" />
          <span className="flex-1">
            {unpaid.length === 1 ? "You have an order waiting for payment." : `You have ${unpaid.length} orders waiting for payment.`} Pay to confirm it and we&apos;ll ship.
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <li key={label} className="rounded-xl bg-card p-5 ring-1 ring-foreground/[0.07]">
            <Icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Recent orders</h2>
          {orders.length > 3 && (
            <Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">
              View all {orders.length}
            </Link>
          )}
        </div>
        {orders.length ? (
          <ul className="space-y-3">
            {orders.slice(0, 3).map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Orders you place with {customer.email} will show up here.</p>
            <Button asChild className="mt-4">
              <Link href="/shop">Start shopping</Link>
            </Button>
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/[0.07] md:col-span-1">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin className="size-4 text-primary" /> Default address
          </h2>
          {address ? (
            <address className="mt-3 text-sm not-italic text-muted-foreground">
              <span className="font-medium text-foreground">{address.name}</span>
              <br />
              {address.address}
              <br />
              {address.suburb} {address.state} {address.postcode}
              <br />
              {address.phone}
            </address>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Save an address and checkout fills it in for you.</p>
          )}
          <Link href="/account/addresses" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            {address ? "Manage addresses" : "Add an address"}
          </Link>
        </section>
        <Link href="/fitting" className="group rounded-xl bg-card p-5 ring-1 ring-foreground/[0.07] transition-colors hover:bg-muted">
          <CalendarCheck className="size-5 text-primary" />
          <p className="mt-3 font-semibold">Book a fitting</p>
          <p className="text-sm text-muted-foreground">Have a local installer fit your parts.</p>
        </Link>
        <Link href="/shop?sale=1" className="group rounded-xl bg-ink p-5 text-ink-foreground">
          <Zap className="size-5 fill-primary text-primary" />
          <p className="mt-3 font-semibold">Today&apos;s deals</p>
          <p className="text-sm text-white/65">Price drops, gone at midnight.</p>
        </Link>
      </div>
    </>
  );
}
