import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { getDefaultAddress } from "@/lib/server/account";
import { getCustomer } from "@/lib/server/customer";
import { paypalEnabled } from "@/lib/server/paypal";
import { CheckoutForm, type CheckoutPrefill } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout · CarBeat" };

export default async function CheckoutPage() {
  const customer = await getCustomer();
  const address = customer && (await getDefaultAddress(customer.id));
  const prefill: CheckoutPrefill | null = customer && {
    email: customer.email,
    name: address?.name ?? customer.name,
    phone: address?.phone ?? "",
    address: address?.address ?? "",
    suburb: address?.suburb ?? "",
    state: address?.state ?? "",
    postcode: address?.postcode ?? "",
  };
  return (
    <PageShell crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} title="Checkout">
      <CheckoutForm payOnline={paypalEnabled()} prefill={prefill} />
    </PageShell>
  );
}
