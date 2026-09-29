import type { Category, Product } from "./types";

/**
 * Cart pricing, shared by the checkout preview (client) and order creation (server).
 * The server always recomputes from database prices; client figures are only a preview.
 * All amounts are in cents, GST inclusive.
 */

export type PricedLine = { product: Pick<Product, "id" | "name" | "category" | "price" | "deal">; qty: number };

export const DELIVERY_OPTIONS = {
  standard: { label: "Standard (3-6 business days)", fee: 995, freeOver: 9900 },
  express: { label: "Express (1-2 business days)", fee: 1495, freeOver: null },
  collect: { label: "Click & collect from a fitting partner", fee: 0, freeOver: null },
} as const;

export type Delivery = keyof typeof DELIVERY_OPTIONS;

export const COUPONS = {
  BASSDROP: "30% off stereos, speakers and subs when you buy all three",
  FIRSTBEAT: "$50 off your first order over $299",
  GLOWUP: "Buy 2 lighting items, get the 3rd free",
} as const;

export type CouponCode = keyof typeof COUPONS;

export function unitPriceCents(product: PricedLine["product"]) {
  return (product.deal?.price ?? product.price) * 100;
}

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  gst: number;
  coupon: CouponCode | null;
  couponError: string | null;
};

export function priceCart(
  lines: PricedLine[],
  opts: { coupon?: string | null; delivery: Delivery; isFirstOrder?: boolean },
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + unitPriceCents(l.product) * l.qty, 0);

  let coupon: CouponCode | null = null;
  let couponError: string | null = null;
  let discount = 0;
  const code = opts.coupon?.trim().toUpperCase();

  if (code) {
    if (!(code in COUPONS)) {
      couponError = "That code isn't valid.";
    } else {
      const result = applyCoupon(code as CouponCode, lines, subtotal, opts.isFirstOrder ?? true);
      if (typeof result === "string") couponError = result;
      else {
        coupon = code as CouponCode;
        discount = result;
      }
    }
  }

  const option = DELIVERY_OPTIONS[opts.delivery];
  const afterDiscount = subtotal - discount;
  const shipping = lines.length === 0 || (option.freeOver !== null && afterDiscount >= option.freeOver) ? 0 : option.fee;
  const total = afterDiscount + shipping;

  return { subtotal, discount, shipping, total, gst: Math.round(total / 11), coupon, couponError };
}

/** Returns the discount in cents, or a reason the code doesn't apply. */
function applyCoupon(code: CouponCode, lines: PricedLine[], subtotal: number, isFirstOrder: boolean): number | string {
  const inCategories = (cats: Category[]) => lines.filter((l) => cats.includes(l.product.category));

  switch (code) {
    case "BASSDROP": {
      const bundle: Category[] = ["stereo", "speaker", "subwoofer"];
      const missing = bundle.filter((c) => !lines.some((l) => l.product.category === c));
      if (missing.length) return "Add a stereo, speakers and a subwoofer to use BASSDROP.";
      const bundleTotal = inCategories(bundle).reduce((s, l) => s + unitPriceCents(l.product) * l.qty, 0);
      return Math.round(bundleTotal * 0.3);
    }
    case "FIRSTBEAT":
      if (!isFirstOrder) return "FIRSTBEAT is for first orders only.";
      if (subtotal < 29900) return "FIRSTBEAT needs an order of $299 or more.";
      return 5000;
    case "GLOWUP": {
      // Every third lighting unit is free, cheapest units first.
      const units = inCategories(["lighting"])
        .flatMap((l) => Array.from({ length: l.qty }, () => unitPriceCents(l.product)))
        .sort((a, b) => a - b);
      const free = Math.floor(units.length / 3);
      if (free === 0) return "Add 3 lighting items to use GLOWUP.";
      return units.slice(0, free).reduce((s, c) => s + c, 0);
    }
  }
}
