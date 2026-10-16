"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { payWithAfterpay } from "@/app/actions";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="xl" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Taking you to Afterpay…
        </>
      ) : (
        "Pay with Afterpay"
      )}
    </Button>
  );
}

/** Sends the shopper to Afterpay to pay an order awaiting payment. */
export function AfterpayButton({ orderId }: { orderId: string }) {
  return (
    <form action={payWithAfterpay.bind(null, orderId)}>
      <Submit />
    </form>
  );
}
