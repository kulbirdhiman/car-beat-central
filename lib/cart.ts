"use client";

import { useSyncExternalStore } from "react";
import type { CartLine } from "./types";

const KEY = "carbeat:cart:v2";
const MAX_QTY = 20;
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function cartLineKey(line: Pick<CartLine, "productId" | "variantValues">) {
  return `${line.productId}:${JSON.stringify(line.variantValues ?? [])}`;
}

export function addToCart(productId: string, qty = 1, variantValues?: string[]) {
  const lines = read();
  const nextLine = { productId, qty: 1, ...(variantValues?.length ? { variantValues } : {}) };
  const key = cartLineKey(nextLine);
  const existing = lines.find((line) => cartLineKey(line) === key);
  write(
    existing
      ? lines.map((line) => (cartLineKey(line) === key ? { ...line, qty: Math.min(MAX_QTY, line.qty + qty) } : line))
      : [...lines, { ...nextLine, qty: Math.min(MAX_QTY, qty) }],
  );
}

export function setQty(productId: string, qty: number, variantValues?: string[]) {
  if (qty < 1) return removeFromCart(productId, variantValues);
  const key = cartLineKey({ productId, variantValues });
  write(read().map((line) => (cartLineKey(line) === key ? { ...line, qty: Math.min(MAX_QTY, qty) } : line)));
}

export function removeFromCart(productId: string, variantValues?: string[]) {
  const key = cartLineKey({ productId, variantValues });
  write(read().filter((line) => cartLineKey(line) !== key));
}

export function clearCart() {
  write([]);
}

const EMPTY: CartLine[] = [];

/** Cart lines. Empty during SSR and hydration. */
export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount() {
  return useCart().reduce((n, l) => n + l.qty, 0);
}
