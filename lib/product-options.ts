import type { Product } from "./types";

export function normalizeProductOptionGroups(raw: unknown, basePrice = 0, legacyVariants: unknown = []): NonNullable<Product["optionGroups"]> {
  if (!Array.isArray(raw)) return [];
  const parsed = raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const group = item as { name?: unknown; required?: unknown; values?: unknown };
    if (typeof group.name !== "string" || !Array.isArray(group.values)) return [];
    return [{
      name: group.name,
      required: group.required !== false,
      values: group.values.flatMap((value): { name: string; price: number }[] => {
        if (typeof value === "string") return [{ name: value, price: 0 }];
        if (!value || typeof value !== "object") return [];
        const choice = value as { name?: unknown; price?: unknown };
        return typeof choice.name === "string" && typeof choice.price === "number" ? [{ name: choice.name, price: choice.price }] : [];
      }),
    }];
  });
  if (!Array.isArray(legacyVariants) || !parsed.some((group, index) => Array.isArray((raw[index] as { values?: unknown })?.values) && (raw[index] as { values: unknown[] }).values.some((value) => typeof value === "string"))) return parsed;

  const groups = raw.map((item) => item as { name: string; values: string[] });
  const combinations = (legacyVariants as unknown[]).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const variant = item as { values?: unknown; price?: unknown };
    return Array.isArray(variant.values) && variant.values.every((value) => typeof value === "string") && typeof variant.price === "number"
      ? [{ values: variant.values as string[], price: variant.price }]
      : [];
  });
  const defaults = groups.map((group) => group.values.find((value) => typeof value === "string") ?? "");
  const baseVariant = combinations.find((variant) => variant.values.every((value, index) => value === defaults[index]));
  const baselinePrice = baseVariant?.price ?? basePrice;
  return parsed.map((group, groupIndex) => ({
    ...group,
    values: group.values.map((choice, choiceIndex) => {
      const selected = defaults.map((value, index) => index === groupIndex ? choice.name : value);
      const variant = combinations.find((item) => item.values.every((value, index) => value === selected[index]));
      const difference = (variant?.price ?? baselinePrice) - baselinePrice;
      return { ...choice, price: Math.max(0, difference + (groupIndex === 0 && choiceIndex === 0 ? baselinePrice - basePrice : 0)) };
    }),
  }));
}

export function selectedOptionPriceAdjustment(groups: NonNullable<Product["optionGroups"]>, values?: string[]) {
  if (groups.length === 0) return values?.length ? null : 0;
  if (!values || values.length !== groups.length) return null;
  let adjustment = 0;
  for (const [index, group] of groups.entries()) {
    if (!values[index] && !group.required) continue;
    const choice = group.values.find((item) => item.name === values[index]);
    if (!choice) return null;
    adjustment += choice.price;
  }
  return adjustment;
}

/** Resolve the base product/deal price plus the independent selected option adjustments. */
export function selectedProductPrice(product: Pick<Product, "optionGroups" | "price" | "deal">, values?: string[]) {
  const groups = product.optionGroups ?? [];
  const adjustment = selectedOptionPriceAdjustment(groups, values);
  return adjustment === null ? null : product.price + adjustment;
}

export function selectedOptionSummary(product: Product, values?: string[]) {
  if (!values) return "";
  return (product.optionGroups ?? []).map((group, index) => `${group.name}: ${values[index] ?? ""}`).filter((part) => !part.endsWith(": ")).join(" · ");
}
