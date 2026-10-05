"use client";

import { CarBrandsContext } from "@/lib/garage";
import type { CarBrand } from "@/lib/types";

/** Makes the database's vehicle list available to every vehicle picker in the store. */
export function CarBrandsProvider({ brands, children }: { brands: CarBrand[]; children: React.ReactNode }) {
  return <CarBrandsContext value={brands}>{children}</CarBrandsContext>;
}
