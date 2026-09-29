"use client";

import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";

export function BuyBox({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <div className="flex h-12 items-center rounded-full border">
        <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>
          <Minus />
        </Button>
        <span className="w-8 text-center font-medium tabular-nums" aria-live="polite">
          {qty}
        </span>
        <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label="Increase quantity" disabled={qty >= 20} onClick={() => setQty((q) => q + 1)}>
          <Plus />
        </Button>
      </div>
      <Button
        size="lg"
        className="h-12 flex-1 rounded-full text-base"
        onClick={() => {
          addToCart(productId, qty);
          toast.success(`Added ${qty} to cart`, { description: name, action: { label: "View cart", onClick: () => router.push("/cart") } });
        }}
      >
        <ShoppingBag /> Add to cart
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="h-12 w-full rounded-full text-base sm:w-auto"
        onClick={() => {
          addToCart(productId, qty);
          router.push("/checkout");
        }}
      >
        <Zap /> Buy now
      </Button>
    </div>
  );
}
