"use client";

import { Check, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  name: string;
  /** "block" renders a full-width labelled button (product cards); "icon" a compact square. */
  variant?: "icon" | "block";
  className?: string;
};

export function AddToCartButton({ productId, name, variant = "icon", className }: Props) {
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const onClick = () => {
    addToCart(productId);
    setAdded(true);
    toast.success("Added to cart", { description: name, action: { label: "View cart", onClick: () => router.push("/cart") } });
    setTimeout(() => setAdded(false), 1500);
  };

  if (variant === "block") {
    return (
      <Button
        variant={added ? "default" : "ink"}
        aria-label={`Add ${name} to cart`}
        className={cn("h-10 w-full gap-2 hover:bg-primary hover:text-primary-foreground", added && "bg-success hover:bg-success", className)}
        onClick={onClick}
      >
        {added ? <Check className="animate-in zoom-in" /> : <ShoppingBag />}
        {added ? "Added" : "Add to cart"}
      </Button>
    );
  }

  return (
    <Button
      size="icon-lg"
      variant={added ? "default" : "outline"}
      aria-label={`Add ${name} to cart`}
      className={cn("size-10 hover:border-primary hover:bg-primary hover:text-primary-foreground", className)}
      onClick={onClick}
    >
      {added ? <Check className="animate-in zoom-in" /> : <Plus />}
    </Button>
  );
}
