"use client";

import { useSyncExternalStore } from "react";
import { CAR_BRANDS } from "./data";

const KEY = "carbeat:garage";
const listeners = new Set<() => void>();

export type GarageCar = {
  brand: (typeof CAR_BRANDS)[number];
  model: (typeof CAR_BRANDS)[number]["models"][number];
};

/** Saved model id, or null. Storage can be unavailable (private mode), so reads never throw. */
export function readGarage(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(modelId: string | null) {
  try {
    if (modelId) localStorage.setItem(KEY, modelId);
    else localStorage.removeItem(KEY);
  } catch {
    // Not persisted, but listeners still update this page.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function findCar(modelId: string | null): GarageCar | null {
  for (const brand of CAR_BRANDS) {
    const model = brand.models.find((m) => m.id === modelId);
    if (model) return { brand, model };
  }
  return null;
}

/** The shopper's saved car. Always null during SSR and hydration. */
export function useGarage() {
  const modelId = useSyncExternalStore(subscribe, readGarage, () => null);
  return {
    car: findCar(modelId),
    save: (id: string) => write(id),
    clear: () => write(null),
  };
}
