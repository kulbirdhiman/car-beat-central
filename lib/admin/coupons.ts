import { couponValueLabel, promoStatus, type AdminProduct, type Coupon, type Department, type VehicleMake } from "./mock-data";

/**
 * Coupon rules: which cart lines a code applies to, and how much it takes off.
 * Pure functions so the admin "Test this coupon" panel and, later, checkout share one implementation.
 * Money in and out is cents; coupon settings (value, minOrder, maxDiscount) are whole AUD.
 */

export type TestLine = { product: AdminProduct; qty: number };

export type CouponResult =
  | { ok: true; discount: number; freeShipping: boolean; eligibleSubtotal: number; capped: boolean; eligibleProductIds: string[] }
  | { ok: false; reason: string };

/** Whether a product is covered by the coupon's scope. */
export function couponCoversProduct(coupon: Coupon, product: AdminProduct) {
  switch (coupon.scope) {
    case "all":
      return true;
    case "products":
      return coupon.productIds.includes(product.id);
    case "departments":
      return coupon.departmentIds.includes(product.departmentId);
    case "models":
      return product.fits === "universal" || product.fits.some((id) => coupon.modelIds.includes(id));
  }
}

const cents = (aud: number) => aud * 100;
const lineTotal = (l: TestLine) => cents(l.product.price) * l.qty;

export function evaluateCoupon(coupon: Coupon, lines: TestLine[], opts: { isFirstOrder: boolean }): CouponResult {
  const status = promoStatus(coupon);
  if (status === "off") return { ok: false, reason: "This code is turned off." };
  if (status === "expired") return { ok: false, reason: "This code has expired." };
  if (status === "scheduled") return { ok: false, reason: "This code hasn't started yet." };
  if (status === "used_up") return { ok: false, reason: "This code has reached its usage limit." };
  if (coupon.firstOrderOnly && !opts.isFirstOrder) return { ok: false, reason: "This code is for first orders only." };
  if (lines.length === 0) return { ok: false, reason: "The cart is empty." };

  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  if (subtotal < cents(coupon.minOrder)) {
    return { ok: false, reason: `Needs an order of $${coupon.minOrder} or more (cart is $${(subtotal / 100).toFixed(2)}).` };
  }

  const eligible = lines.filter((l) => couponCoversProduct(coupon, l.product));
  if (eligible.length === 0) return { ok: false, reason: "Nothing in the cart qualifies for this code." };
  const eligibleSubtotal = eligible.reduce((s, l) => s + lineTotal(l), 0);

  let discount = 0;
  switch (coupon.type) {
    case "percent":
      discount = Math.round((eligibleSubtotal * coupon.value) / 100);
      break;
    case "fixed":
      discount = Math.min(cents(coupon.value), eligibleSubtotal);
      break;
    case "buy_x_get_y": {
      // For every (buy + get) qualifying units, the cheapest `get` of them are free.
      const units = eligible.flatMap((l) => Array.from({ length: l.qty }, () => cents(l.product.price))).sort((a, b) => a - b);
      const free = Math.floor(units.length / (coupon.buyQty + coupon.getQty)) * coupon.getQty;
      if (free === 0) return { ok: false, reason: `Add ${coupon.buyQty + coupon.getQty} qualifying items to use this code.` };
      discount = units.slice(0, free).reduce((s, c) => s + c, 0);
      break;
    }
    case "free_shipping":
      discount = 0;
      break;
  }

  const cap = coupon.maxDiscount === null ? Infinity : cents(coupon.maxDiscount);
  return {
    ok: true,
    discount: Math.min(discount, cap),
    freeShipping: coupon.type === "free_shipping",
    eligibleSubtotal,
    capped: discount > cap,
    eligibleProductIds: eligible.map((l) => l.product.id),
  };
}

/** "All products", "Car Stereos, Audio Equipment", "Toyota HiLux · Ford Ranger", "2 products: …". */
export function couponScopeSummary(coupon: Coupon, data: { products: AdminProduct[]; departments: Department[]; makes: VehicleMake[] }) {
  switch (coupon.scope) {
    case "all":
      return "All products";
    case "products": {
      const names = coupon.productIds.map((id) => data.products.find((p) => p.id === id)?.name ?? "Deleted product");
      return names.length === 1 ? names[0]! : `${names.length} products: ${names.join(", ")}`;
    }
    case "departments":
      return coupon.departmentIds.map((id) => data.departments.find((d) => d.id === id)?.name ?? "Deleted department").join(", ");
    case "models":
      return (
        data.makes
          .flatMap((make) => {
            const names = make.models.filter((m) => coupon.modelIds.includes(m.id)).map((m) => m.name);
            return names.length ? [`${make.name} ${names.join(", ")}`] : [];
          })
          .join(" · ") || "No models"
      );
  }
}

/** "Min. $200 · Up to $250 off · First order only". */
export function couponConditions(coupon: Coupon) {
  return (
    [
      coupon.minOrder > 0 && `Min. order $${coupon.minOrder}`,
      coupon.maxDiscount !== null && `Up to $${coupon.maxDiscount} off`,
      coupon.firstOrderOnly && "First order only",
    ]
      .filter(Boolean)
      .join(" · ") || "No conditions"
  );
}

export { couponValueLabel };
