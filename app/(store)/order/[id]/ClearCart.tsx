"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

/** Empties the cart once the order confirmation has loaded. */
export function ClearCart() {
  useEffect(() => clearCart(), []);
  return null;
}
