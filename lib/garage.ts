"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { CarBrand } from "./types";

const KEY = "carbeat:garage";
const listeners = new Set<() => void>();

export type GarageCar = {
  brand: CarBrand;
  model: CarBrand["models"][number];
};

/** Vehicle makes and models from the database, provided once by the store layout (see CarBrandsProvider). */
export const CarBrandsContext = createContext<CarBrand[]>([]);

export function useCarBrands() {
  return useContext(CarBrandsContext);
}

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

export function findCar(brands: CarBrand[], modelId: string | null): GarageCar | null {
  for (const brand of brands) {
    const model = brand.models.find((m) => m.id === modelId);
    if (model) return { brand, model };
  }
  return null;
}

/** The shopper's saved car. Always null during SSR and hydration. */
export function useGarage() {
  const brands = useCarBrands();
  const modelId = useSyncExternalStore(subscribe, readGarage, () => null);
  return {
    // A saved model the admin has since deleted reads as no car.
    car: findCar(brands, modelId),
    save: (id: string) => write(id),
    clear: () => write(null),
  };
}
