import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Your cart · CarBeat" };

export default function CartPage() {
  return (
    <PageShell crumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]} title="Your cart">
      <CartView />
    </PageShell>
  );
}
