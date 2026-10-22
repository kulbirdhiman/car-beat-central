import "server-only";
import { CATEGORY_LABELS } from "../data";
import type { Product, Spec } from "../types";

/** The product's own specification rows, as entered in the admin, without the common ones. */
export function getProductSpecs(product: Pick<Product, "specs">): Spec[] {
  return product.specs;
}

/** Common rows first, then the product's own. */
export function getSpecs(product: Product): Spec[] {
  return [
    ["Brand", product.brand],
    ["Category", product.departmentName ?? CATEGORY_LABELS[product.category]],
    ...product.specs,
    ["Fitment", product.fits === "universal" ? "Universal" : `${product.fits.length} vehicle models`],
    ["Warranty", "12 months"],
  ];
}
