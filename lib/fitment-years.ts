import type { Product } from "./types";

export function fitmentYearLabel(product: Pick<Product, "fitmentYears">, id: string): string {
  const range = product.fitmentYears?.[id];
  if (!range) return "";
  if (range.from != null && range.to != null) return `${range.from}–${range.to}`;
  if (range.from != null) return `${range.from} onwards`;
  if (range.to != null) return `up to ${range.to}`;
  return "";
}

export function fitmentLabel(product: Pick<Product, "fitmentYears">, id: string, name: string): string {
  const years = fitmentYearLabel(product, id);
  return years ? `${name} (${years})` : name;
}

/** Product ranges take precedence over the vehicle catalogue's general production years. */
export function vehicleYearLabel(vehicle: { fitmentYearRanges?: string[]; years?: string }): string {
  return vehicle.fitmentYearRanges?.length ? vehicle.fitmentYearRanges.join(", ") : vehicle.years ?? "";
}

export function vehicleOptionLabel(vehicle: { name: string; fitmentYearRanges?: string[]; years?: string }): string {
  const years = vehicleYearLabel(vehicle);
  return years ? `${vehicle.name} · ${years}` : vehicle.name;
}

/** Individual year choices from product ranges, falling back to catalogue production years. */
export function vehicleYearOptions(vehicle?: { fitmentYearRanges?: string[]; years?: string }): number[] {
  if (!vehicle) return [];
  const ranges = vehicle.fitmentYearRanges?.length ? vehicle.fitmentYearRanges : vehicle.years ? [vehicle.years] : [];
  const years = new Set<number>();
  const latest = new Date().getFullYear() + 1;
  if (!ranges.length) return Array.from({ length: latest - 1900 + 1 }, (_, index) => latest - index);
  for (const range of ranges) {
    const numbers = range.match(/[0-9]{4}/g)?.map(Number) ?? [];
    if (!numbers.length) continue;
    const from = range.startsWith("up to") ? 1900 : numbers[0];
    const to = numbers[1] ?? (/present|onwards/i.test(range) ? latest : numbers[0]);
    for (let year = from; year <= to; year++) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}
