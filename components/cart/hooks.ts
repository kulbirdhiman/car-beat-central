"use client";

import { useEffect, useState } from "react";
import type { Delivery, Totals } from "@/lib/pricing";
import type { CartLine, Product } from "@/lib/types";

/** Loads product details for the cart lines from the catalogue API. */
export function useCartProducts(lines: CartLine[]) {
  const ids = lines.map((l) => l.productId).sort().join(",");
  const [state, setState] = useState<{ ids: string; products: Record<string, Product> } | null>(null);

  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(ids)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { products: Product[] }) => setState({ ids, products: Object.fromEntries(data.products.map((p) => [p.id, p])) }))
      .catch(() => {});
    return () => controller.abort();
  }, [ids]);

  // Only report loaded once the response matches the current cart.
  return { products: state?.products ?? {}, loading: !!ids && state?.ids !== ids };
}

/** Server-computed totals for the cart, refreshed as inputs change. */
export function useQuote(lines: CartLine[], opts: { coupon?: string; delivery: Delivery; email?: string }) {
  const key = JSON.stringify({ lines, ...opts });
  const [quote, setQuote] = useState<{ key: string; totals: Totals } | null>(null);

  useEffect(() => {
    const body = JSON.parse(key) as { lines: CartLine[] };
    if (body.lines.length === 0) return;
    const controller = new AbortController();
    const id = setTimeout(() => {
      fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: key,
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data: { totals?: Totals }) => data.totals && setQuote({ key, totals: data.totals }))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [key]);

  return { totals: quote?.totals ?? null, stale: quote?.key !== key };
}
