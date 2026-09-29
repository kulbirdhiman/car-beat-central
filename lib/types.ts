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
  badge?: string;
  image: string;
  description: string;
  features: string[];
  /** Present when the product is in today's deals. */
  deal?: { price: number; claimed: number };
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
  code: string;
  highlight: string;
  image: string;
};

export type CartLine = { productId: string; qty: number };

export type OrderStatus = "pending_payment" | "paid" | "fulfilled" | "cancelled";
