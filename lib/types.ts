export type Category =
  | "stereo"
  | "speaker"
  | "subwoofer"
  | "amplifier"
  | "dashcam"
  | "lighting"
  | "mount"
  | "interior";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  /** Everyday price in whole AUD, GST inclusive. */
  price: number;
  rrp: number;
  rating: number;
  reviews: number;
  /** Car model ids this product fits, or "universal". */
  fits: string[] | "universal";
  /** Admin department the product belongs to (used for coupon scopes). */
  departmentId: string | null;
  /** Name of the product's department, shown as its category in the store. */
  departmentName: string | null;
  /** Parent of the product's department when that is a sub-department, else null. */
  departmentParentId: string | null;
  /** Units on hand; 0 means sold out. */
  stock: number;
  badge?: string;
  image: string;
  description: string;
  features: string[];
  /** The product's own specification rows. */
  specs: Spec[];
  /** Products offered as optional extras on this product's page. */
  addOnIds: string[];
  /** Present when the product is in today's deals. */
  deal?: { price: number; claimed: number };
};

/** A specification row, e.g. ["Screen", '9" HD touchscreen']. */
export type Spec = [label: string, value: string];

/** An active admin department as the store shows it, with its live product count. */
export type StoreDepartment = {
  id: string;
  slug: string;
  name: string;
  image: string;
  /** Active products in this department, including its sub-departments. */
  count: number;
  /** Sub-departments that have products, in admin order. */
  children: StoreDepartment[];
};

export type CarBrand = {
  id: string;
  name: string;
  models: { id: string; name: string }[];
};

export type Offer = {
  id: string;
  title: string;
  subtitle: string;
  /** Coupon code shown on the banner, if the offer has one. */
  code: string | null;
  highlight: string;
  image: string;
  /** Where "Shop this offer" goes. */
  href: string;
};

export type CartLine = { productId: string; qty: number };

/** "refunded": paid, then refunded in full. Partly refunded orders keep their status. */
export type OrderStatus = "pending_payment" | "paid" | "fulfilled" | "cancelled" | "refunded";

/** An Australian suburb with its state and postcode. */
export type Locality = { suburb: string; state: string; postcode: string };
