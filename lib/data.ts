import type { CarBrand, Category, Offer, Product } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  stereo: "Car Stereos",
  speaker: "Speakers",
  subwoofer: "Subwoofers",
  amplifier: "Amplifiers",
  dashcam: "Dash Cams",
  lighting: "LED Lighting",
  mount: "Mounts & Chargers",
  interior: "Interior",
};

export const CATEGORY_IMAGES: Record<Category, string> = {
  stereo: "/images/stereo-android.jpg",
  speaker: "/images/speaker-coaxial.jpg",
  subwoofer: "/images/hero-subwoofer-build.jpg",
  amplifier: "/images/amplifier.jpg",
  dashcam: "/images/dashcam-mount.jpg",
  lighting: "/images/headlights-red.jpg",
  mount: "/images/phone-mount.jpg",
  interior: "/images/air-vents.jpg",
};

export const CAR_BRANDS: CarBrand[] = [
  {
    id: "toyota",
    name: "Toyota",
    models: [
      { id: "hilux", name: "HiLux" },
      { id: "rav4", name: "RAV4" },
      { id: "landcruiser", name: "LandCruiser" },
      { id: "corolla", name: "Corolla" },
    ],
  },
  {
    id: "ford",
    name: "Ford",
    models: [
      { id: "ranger", name: "Ranger" },
      { id: "everest", name: "Everest" },
    ],
  },
  {
    id: "mazda",
    name: "Mazda",
    models: [
      { id: "cx5", name: "CX-5" },
      { id: "bt50", name: "BT-50" },
      { id: "mazda3", name: "Mazda3" },
    ],
  },
  {
    id: "hyundai",
    name: "Hyundai",
    models: [
      { id: "i30", name: "i30" },
      { id: "tucson", name: "Tucson" },
    ],
  },
  {
    id: "mitsubishi",
    name: "Mitsubishi",
    models: [
      { id: "triton", name: "Triton" },
      { id: "outlander", name: "Outlander" },
    ],
  },
  {
    id: "kia",
    name: "Kia",
    models: [{ id: "sportage", name: "Sportage" }],
  },
  {
    id: "isuzu",
    name: "Isuzu",
    models: [{ id: "dmax", name: "D-Max" }],
  },
];

export const OFFERS: Offer[] = [
  {
    id: "o1",
    title: "Ute & 4x4 Audio Upgrade",
    subtitle: "Stereo + speakers + sub bundle for HiLux, Ranger, Triton and more. Free fitting.",
    code: "BASSDROP",
    highlight: "30% OFF",
    image: "/images/hero-ranger.jpg",
    href: "/shop?category=stereo",
  },
  {
    id: "o2",
    title: "Road-trip ready",
    subtitle: "$50 off your first order over $299",
    code: "FIRSTBEAT",
    highlight: "$50 OFF",
    image: "/images/coast-road.jpg",
    href: "/shop",
  },
  {
    id: "o3",
    title: "Lighting Week",
    subtitle: "All LED headlights and ambient kits",
    code: "GLOWUP",
    highlight: "Buy 2 Get 1",
    image: "/images/headlights-red.jpg",
    href: "/shop?category=lighting",
  },
];

export function productFitsModel(product: Pick<Product, "fits">, modelId: string) {
  return product.fits === "universal" || product.fits.includes(modelId);
}

export function discountPercent(price: number, rrp: number) {
  return Math.round(((rrp - price) / rrp) * 100);
}

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return aud.format(value);
}

const audCents = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

/** Formats an amount in cents, e.g. 99500 -> "$995.00". */
export function formatCents(cents: number) {
  return audCents.format(cents / 100);
}

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export const FITTING_CITIES = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Hobart", "Canberra", "Darwin"] as const;

/** Customer support inbox, used on the policy pages. */
export const SUPPORT_EMAIL = "support@carbeat.com.au";

/** Extra lifestyle photos per category, shown after the product shot in the gallery. */
export const CATEGORY_GALLERY: Record<Category, string[]> = {
  stereo: ["/images/hero-interior.jpg", "/images/stereo-carplay.jpg", "/images/stereo-android.jpg"],
  speaker: ["/images/speaker-component.jpg", "/images/speaker-coaxial.jpg", "/images/trunk-audio.jpg"],
  subwoofer: ["/images/subwoofer-underseat.jpg", "/images/subwoofer-tube.jpg", "/images/hero-subwoofer-build.jpg"],
  amplifier: ["/images/trunk-audio.jpg", "/images/hero-subwoofer-build.jpg"],
  dashcam: ["/images/dashcam.jpg", "/images/dashcam-mount.jpg", "/images/coast-road.jpg"],
  lighting: ["/images/headlights.jpg", "/images/headlights-red.jpg", "/images/ambient-light.jpg"],
  mount: ["/images/phone-mount.jpg", "/images/coast-road.jpg"],
  interior: ["/images/ambient-light.jpg", "/images/floor-mats.jpg", "/images/air-vents.jpg"],
};
