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

export function addToCart(productId: string, qty = 1) {
  const lines = read();
  const existing = lines.find((l) => l.productId === productId);
  write(
    existing
      ? lines.map((l) => (l.productId === productId ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
      : [...lines, { productId, qty: Math.min(MAX_QTY, qty) }],
  );
}

export function setQty(productId: string, qty: number) {
  if (qty < 1) return removeFromCart(productId);
  write(read().map((l) => (l.productId === productId ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)));
}

export function removeFromCart(productId: string) {
  write(read().filter((l) => l.productId !== productId));
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
