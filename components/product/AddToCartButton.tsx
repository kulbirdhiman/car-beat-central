"use client";

import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";

export function AddToCartButton({ productId, name }: { productId: string; name: string }) {
  const [added, setAdded] = useState(false);
  const router = useRouter();

  return (
    <Button
      size="icon-lg"
      variant={added ? "default" : "outline"}
      aria-label={`Add ${name} to cart`}
      className="size-10 hover:border-primary hover:bg-primary hover:text-primary-foreground"
      onClick={() => {
        addToCart(productId);
        setAdded(true);
        toast.success("Added to cart", { description: name, action: { label: "View cart", onClick: () => router.push("/cart") } });
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? <Check className="animate-in zoom-in" /> : <Plus />}
    </Button>
  );
}
