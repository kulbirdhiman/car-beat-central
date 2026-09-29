import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout · CarBeat" };

export default function CheckoutPage() {
  return (
    <PageShell crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} title="Checkout">
      <CheckoutForm />
    </PageShell>
  );
}
