import { evaluateCoupon } from "./admin/coupons";
import type { Coupon } from "./admin/model";
import type { Product } from "./types";

/**
 * Cart pricing for checkout. The server always prices from database products and coupons;
 * client figures are only a preview. All amounts are in cents, GST inclusive.
 */

export type PricedLine = { product: Pick<Product, "id" | "name" | "category" | "price" | "deal" | "departmentId" | "departmentParentId" | "fits">; qty: number };

export const DELIVERY_OPTIONS = {
  standard: { label: "Standard (3-6 business days)", fee: 995, freeOver: 9900 },
  express: { label: "Express (1-2 business days)", fee: 1495, freeOver: null },
  collect: { label: "Click & collect from a fitting partner", fee: 0, freeOver: null },
} as const;

export type Delivery = keyof typeof DELIVERY_OPTIONS;

export function unitPriceCents(product: PricedLine["product"]) {
  return (product.deal?.price ?? product.price) * 100;
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
  const subtotal = lines.reduce((sum, l) => sum + unitPriceCents(l.product) * l.qty, 0);

  let coupon: string | null = null;
  let couponError: string | null = null;
  let discount = 0;
  let freeShipping = false;

  if (opts.couponCode?.trim()) {
    if (!opts.coupon) {
      couponError = "That code isn't valid.";
    } else {
      // Coupons see the price actually charged, so deals and codes stack the way the cart shows them.
      const couponLines = lines.map((l) => ({ product: { ...l.product, price: unitPriceCents(l.product) / 100 }, qty: l.qty }));
      const result = evaluateCoupon(opts.coupon, couponLines, { isFirstOrder: opts.isFirstOrder ?? true });
      if (!result.ok) couponError = result.reason;
      else {
        coupon = opts.coupon.code;
        discount = result.discount;
        freeShipping = result.freeShipping;
      }
    }
  }

  const option = DELIVERY_OPTIONS[opts.delivery];
  const afterDiscount = subtotal - discount;
  const shipping =
    lines.length === 0 || freeShipping || (option.freeOver !== null && afterDiscount >= option.freeOver) ? 0 : option.fee;
  const total = afterDiscount + shipping;

  return { subtotal, discount, shipping, total, gst: Math.round(total / 11), coupon, couponError };
}
