"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

/** PayPal's buttons (PayPal, Pay Later, debit or credit card) for an order awaiting payment. */
export function PayPalCheckout({ orderId, clientId }: { orderId: string; clientId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <PayPalScriptProvider options={{ clientId, currency: "AUD", intent: "capture", components: "buttons", locale: "en_AU" }}>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {confirming ? (
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Confirming your payment…
        </p>
      ) : (
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "pay" }}
          createOrder={async () => {
            setError(null);
            try {
              return (await post<{ id: string }>("/api/paypal/orders", { orderId })).id;
            } catch (e) {
              setError((e as Error).message);
              throw e;
            }
          }}
          onApprove={async (data) => {
            setConfirming(true);
            try {
              await post("/api/paypal/orders/capture", { orderId, paypalOrderId: data.orderID });
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
              setConfirming(false);
            }
          }}
          onCancel={() => setError("Payment cancelled. You can try again whenever you're ready.")}
          onError={() => setError((current) => current ?? "PayPal ran into a problem. Please try again.")}
        />
      )}
    </PayPalScriptProvider>
  );
}
