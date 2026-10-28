"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { CarBrand } from "./types";

const KEY = "carbeat:garage";
const SUBMODEL_KEY = "carbeat:garage-submodel";
const YEAR_KEY = "carbeat:garage-year";
const listeners = new Set<() => void>();

export type GarageCar = {
  year?: number;
  brand: CarBrand;
  model: CarBrand["models"][number];
  subModel?: NonNullable<CarBrand["models"][number]["subModels"]>[number];
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

function write(modelId: string | null, subModelId?: string, year?: number) {
  try {
    if (modelId && year) localStorage.setItem(YEAR_KEY, String(year));
    else localStorage.removeItem(YEAR_KEY);
    if (modelId) localStorage.setItem(KEY, modelId);
    else localStorage.removeItem(KEY);
    if (modelId && subModelId) localStorage.setItem(SUBMODEL_KEY, subModelId);
    else localStorage.removeItem(SUBMODEL_KEY);
  } catch {
    // Not persisted, but listeners still update this page.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => (e.key === KEY || e.key === SUBMODEL_KEY || e.key === YEAR_KEY) && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function findCar(brands: CarBrand[], modelId: string | null, subModelId?: string | null): GarageCar | null {
  for (const brand of brands) {
    const model = brand.models.find((m) => m.id === modelId);
    if (model) {
      const subModel = model.subModels?.find((s) => s.id === subModelId);
      return { brand, model, ...(subModel ? { subModel } : {}) };
    }
  }
  return null;
}

/** The shopper's saved car. Always null during SSR and hydration. */
export function useGarage() {
  const brands = useCarBrands();
  const modelId = useSyncExternalStore(subscribe, readGarage, () => null);
  const subModelId = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(SUBMODEL_KEY); } catch { return null; }
  }, () => null);
  const year = useSyncExternalStore(subscribe, () => {
    try { return Number(localStorage.getItem(YEAR_KEY)) || undefined; } catch { return undefined; }
  }, () => undefined);
  const car = findCar(brands, modelId, subModelId);
  return {
    // A saved model the admin has since deleted reads as no car.
    car: car ? { ...car, year } : null,
    save: (id: string, subId?: string, year?: number) => write(id, subId, year),
    clear: () => write(null),
  };
}
