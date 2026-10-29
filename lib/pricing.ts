import type { Coupon } from "./admin/model";
import type { Product } from "./types";

/**
 * Cart pricing for checkout. The server always prices from database products and coupons;
 * client figures are only a preview. All amounts are in cents, GST inclusive.
 */

export type PricedLine = { product: Pick<Product, "id" | "name" | "category" | "price" | "deal" | "departmentId" | "departmentParentId" | "fits" | "optionGroups">; qty: number; selectedPrice?: number; variantValues?: string[] };

export const DELIVERY_OPTIONS = {
  standard: { label: "Standard (3-6 business days)", fee: 3100, freeOver: null },
  express: { label: "Express (1-2 business days)", fee: 4500, freeOver: null },
  collect: { label: "Local pickup (we'll let you know when it's ready)", fee: 0, freeOver: null },
} as const;

export type Delivery = keyof typeof DELIVERY_OPTIONS;

export function unitPriceCents(product: PricedLine["product"], selectedPrice?: number) {
  return (selectedPrice ?? product.price) * 100;
}

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  gst: number;
  /** The code that was applied, or null. */
  coupon: string | null;
  couponError: string | null;
};

export function priceCart(
  lines: PricedLine[],
  opts: {
    /** What the shopper typed. */
    couponCode?: string | null;
    /** The coupon with that code, looked up by the caller; null when there's no such code. */
    coupon?: Coupon | null;
    delivery: Delivery;
    isFirstOrder?: boolean;
  },
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + unitPriceCents(l.product, l.selectedPrice) * l.qty, 0);

  const coupon = null;
  const couponError = opts.couponCode?.trim() ? "Discount codes are not available." : null;
  const discount = 0;

  const option = DELIVERY_OPTIONS[opts.delivery];
  const afterDiscount = subtotal - discount;
  const shipping =
    lines.length === 0 ? 0 : option.fee;
  const total = afterDiscount + shipping;

  return { subtotal, discount, shipping, total, gst: Math.round(total / 11), coupon, couponError };
}
