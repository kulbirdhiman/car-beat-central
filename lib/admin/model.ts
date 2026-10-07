import type { Category, OrderStatus } from "@/lib/types";

/** Admin entity types and display helpers, shared by the admin UI and the server. */

export type Department = {
  id: string;
  /** The department this one sits under, or null for a top-level department. Only one level of nesting. */
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  createdAt: string;
};

/** Departments in display order with each one's sub-departments right after it, for pickers and filters. */
export function departmentTree(departments: Department[]): (Department & { depth: 0 | 1 })[] {
  return departments
    .filter((d) => d.parentId === null)
    .flatMap((d) => [{ ...d, depth: 0 as const }, ...departments.filter((c) => c.parentId === d.id).map((c) => ({ ...c, depth: 1 as const }))]);
}

/** "Car Stereos" or, for a sub-department, "Car Stereos › Satnav Car Stereos". */
export function departmentLabel(departments: Department[], id: string): string | null {
  const d = departments.find((x) => x.id === id);
  if (!d) return null;
  const parent = d.parentId ? departments.find((x) => x.id === d.parentId) : null;
  return parent ? `${parent.name} › ${d.name}` : d.name;
}

/** Array order is display order; drag-and-drop in the admin reorders the arrays. */
export type SubModel = { id: string; name: string; description: string; years: string; createdAt: string };
export type VehicleModel = { id: string; name: string; description: string; createdAt: string; subModels: SubModel[] };
export type VehicleMake = { id: string; name: string; description: string; country: string; createdAt: string; models: VehicleModel[] };

export type AdminProduct = {
  id: string;
  /** Store URL, /products/{slug}. Set by the server when the product is created. */
  slug: string;
  sku: string;
  name: string;
  brand: string;
  departmentId: string;
  /** Storefront category, used for shop navigation and filters. */
  category: Category;
  /** Whole AUD, GST inclusive. */
  price: number;
  rrp: number;
  stock: number;
  status: "active" | "draft";
  /** Vehicle model ids this product fits, or "universal". */
  fits: string[] | "universal";
  image: string;
  description: string;
  /** Short label on the product card, e.g. "Best seller". Empty for none. */
  badge: string;
  /** Bullet points on the product page. */
  features: string[];
  /** Today's-deal price in whole AUD, below the price; null when not on deal. */
  dealPrice: number | null;
  /** Shown in the homepage spotlight and trending lists. */
  trending: boolean;
  /** Customer ratings, kept up to date as reviews are written or removed. Read-only in the admin. */
  rating: number;
  reviews: number;
};

export type AdminOrder = {
  id: string;
  /** Human-friendly order number, e.g. "CB-1048". */
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: { name: string; email: string; phone: string };
  shipTo: { address: string; suburb: string; state: string; postcode: string };
  delivery: "standard" | "express" | "collect";
  items: { productId: string; name: string; unitPrice: number; qty: number }[];
  /** All amounts in cents, GST inclusive. */
  shipping: number;
  discount: number;
  coupon?: string;
  /** PayPal transaction (capture) id and when it was paid, once paid online. Refunds are made in PayPal with this id. */
  payment?: { paypalCaptureId: string; paidAt: string };
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  fulfilled: "Shipped",
  cancelled: "Cancelled",
};

export const DELIVERY_LABEL: Record<AdminOrder["delivery"], string> = {
  standard: "Standard",
  express: "Express",
  collect: "Click & collect",
};

export function orderSubtotal(order: AdminOrder) {
  return order.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}

export function orderTotal(order: AdminOrder) {
  return orderSubtotal(order) - order.discount + order.shipping;
}

export const LOW_STOCK = 5;

// Offers & coupons --------------------------------------------------------------------------------

export type CouponType = "percent" | "fixed" | "free_shipping" | "buy_x_get_y";

export type CouponScope = "all" | "products" | "departments" | "models";

export const COUPON_SCOPE_LABEL: Record<CouponScope, string> = {
  all: "All products",
  products: "Specific products",
  departments: "Specific departments",
  models: "Specific vehicle models",
};

export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  percent: "% off",
  fixed: "$ off",
  free_shipping: "Free shipping",
  buy_x_get_y: "Buy X get Y free",
};

export type Coupon = {
  id: string;
  /** Uppercase letters and numbers, entered at checkout. */
  code: string;
  description: string;
  type: CouponType;
  /** Percent (1-100) for "percent", whole AUD for "fixed"; unused otherwise. */
  value: number;
  /** For "buy_x_get_y": buy `buyQty`, get `getQty` free (cheapest first). */
  buyQty: number;
  getQty: number;
  /** Cart subtotal needed before the code works, whole AUD; 0 = no minimum. */
  minOrder: number;
  /** Most the code can take off, whole AUD; null = no cap (e.g. "20% off, up to $100"). */
  maxDiscount: number | null;
  /** Which cart lines the discount applies to. */
  scope: CouponScope;
  /** Used when scope is "products". */
  productIds: string[];
  /** Used when scope is "departments". */
  departmentIds: string[];
  /** Used when scope is "models": products that fit any of these vehicle models (universal products count). */
  modelIds: string[];
  firstOrderOnly: boolean;
  /** null = unlimited. */
  usageLimit: number | null;
  used: number;
  /** YYYY-MM-DD; null = no limit. */
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
};

export type Offer = {
  id: string;
  title: string;
  subtitle: string;
  /** Big text on the banner, e.g. "30% OFF". */
  highlight: string;
  image: string;
  /** Where "Shop this offer" goes. */
  href: string;
  /** Coupon shown on the banner, if any. */
  couponId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
};

export type PromoStatus = "live" | "scheduled" | "expired" | "used_up" | "off";

export const PROMO_STATUS_LABEL: Record<PromoStatus, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
  used_up: "Used up",
  off: "Turned off",
};

/** Today in Sydney as YYYY-MM-DD, for comparing with start/end dates. */
export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

export function promoStatus(p: Pick<Offer, "active" | "startsAt" | "endsAt"> & { usageLimit?: number | null; used?: number }, today = todayISO()): PromoStatus {
  if (!p.active) return "off";
  if (p.endsAt && p.endsAt < today) return "expired";
  if (p.usageLimit != null && (p.used ?? 0) >= p.usageLimit) return "used_up";
  if (p.startsAt && p.startsAt > today) return "scheduled";
  return "live";
}

/** "30% off", "$50 off", "Free shipping", "Buy 2 get 1 free". */
export function couponValueLabel(c: Pick<Coupon, "type" | "value" | "buyQty" | "getQty">) {
  switch (c.type) {
    case "percent":
      return `${c.value}% off`;
    case "fixed":
      return `$${c.value} off`;
    case "free_shipping":
      return "Free shipping";
    case "buy_x_get_y":
      return `Buy ${c.buyQty} get ${c.getQty} free`;
  }
}
