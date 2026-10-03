import type { OrderStatus } from "@/lib/types";

/**
 * Static sample data for the admin panel. Nothing here is persisted: the admin store
 * (components/admin/AdminStore.tsx) copies it into React state on load.
 */

export type Department = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  createdAt: string;
};

/** Array order is display order; drag-and-drop in the admin reorders the arrays. */
export type SubModel = { id: string; name: string; description: string; years: string; createdAt: string };
export type VehicleModel = { id: string; name: string; description: string; createdAt: string; subModels: SubModel[] };
export type VehicleMake = { id: string; name: string; description: string; country: string; createdAt: string; models: VehicleModel[] };

export type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  departmentId: string;
  /** Whole AUD, GST inclusive. */
  price: number;
  rrp: number;
  stock: number;
  status: "active" | "draft";
  /** Vehicle model ids this product fits, or "universal". */
  fits: string[] | "universal";
  image: string;
  description: string;
};

export type AdminOrder = {
  id: string;
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
};

export const DEPARTMENTS: Department[] = [
  { id: "d-stereo", name: "Car Stereos", slug: "car-stereos", description: "Head units with Apple CarPlay, Android Auto and DAB+.", image: "/images/stereo-android.jpg", active: true, createdAt: "2026-06-02T09:00:00+10:00" },
  { id: "d-audio", name: "Audio Equipment", slug: "audio-equipment", description: "Speakers, subwoofers and amplifiers.", image: "/images/speaker-component.jpg", active: true, createdAt: "2026-06-02T09:00:00+10:00" },
  { id: "d-dashcam", name: "Dash Cams", slug: "dash-cams", description: "Front and rear cameras, hardwire kits and storage.", image: "/images/dashcam-mount.jpg", active: true, createdAt: "2026-06-09T09:00:00+10:00" },
  { id: "d-lighting", name: "LED Lighting", slug: "led-lighting", description: "Headlight upgrades and ambient interior lighting.", image: "/images/headlights-red.jpg", active: true, createdAt: "2026-06-15T09:00:00+10:00" },
  { id: "d-mounts", name: "Mounts & Charging", slug: "mounts-charging", description: "Phone mounts, wireless chargers and USB adapters.", image: "/images/phone-mount.jpg", active: true, createdAt: "2026-07-01T09:00:00+10:00" },
  { id: "d-interior", name: "Interior", slug: "interior", description: "Floor mats, seat covers and trim.", image: "/images/floor-mats.jpg", active: true, createdAt: "2026-07-20T09:00:00+10:00" },
  { id: "d-cameras", name: "Reversing Cameras", slug: "reversing-cameras", description: "Rear-view and 360° parking cameras.", image: "/images/coast-road.jpg", active: false, createdAt: "2026-09-12T09:00:00+10:00" },
];

// [id, name, description, years]
type SubSeed = [string, string, string, string];
// [id, name, description, sub-models]
type ModelSeed = [string, string, string, SubSeed[]];

function make(id: string, name: string, country: string, description: string, createdAt: string, models: ModelSeed[]): VehicleMake {
  const at = `${createdAt}T10:00:00+10:00`;
  return {
    id,
    name,
    country,
    description,
    createdAt: at,
    models: models.map(([mid, mname, mdesc, subs]) => ({
      id: mid,
      name: mname,
      description: mdesc,
      createdAt: at,
      subModels: subs.map(([sid, sname, sdesc, years]) => ({ id: sid, name: sname, description: sdesc, years, createdAt: at })),
    })),
  };
}

export const VEHICLE_MAKES: VehicleMake[] = [
  make("bmw", "BMW", "Germany", "Premium sedans and SUVs. Most need CAN-bus adapters to keep iDrive.", "2026-06-02", [
    ["bmw-3-series", "3 Series", "Compact executive sedan and wagon.", [
      ["bmw-320i-g20", "320i (G20)", "2.0L turbo petrol, RWD.", "2019–present"],
      ["bmw-330i-g20", "330i (G20)", "2.0L turbo petrol, higher output.", "2019–present"],
      ["bmw-m340i-g20", "M340i xDrive (G20)", "3.0L six, AWD performance model.", "2020–present"],
      ["bmw-320i-f30", "320i (F30)", "Previous generation, NBT/EVO head units.", "2012–2019"],
    ]],
    ["bmw-x5", "X5", "Large luxury SUV.", [
      ["bmw-x5-30d-g05", "xDrive30d (G05)", "3.0L diesel six.", "2019–present"],
      ["bmw-x5-40i-g05", "xDrive40i (G05)", "3.0L petrol six.", "2019–present"],
    ]],
    ["bmw-1-series", "1 Series", "Front-drive premium hatch.", [["bmw-118i-f40", "118i (F40)", "1.5L turbo three-cylinder.", "2020–present"]]],
  ]),
  make("toyota", "Toyota", "Japan", "Australia's top-selling brand, from utes to hybrids.", "2026-06-02", [
    ["hilux", "HiLux", "Best-selling ute; single, extra and dual cab.", [
      ["hilux-sr", "SR", "Work-spec, basic 6.1\" head unit.", "2015–present"],
      ["hilux-sr5", "SR5", "Mid-spec with 8\" screen.", "2015–present"],
      ["hilux-rogue", "Rogue", "Top-spec with JBL audio.", "2018–present"],
      ["hilux-gr-sport", "GR Sport", "Performance-tuned off-roader.", "2023–present"],
    ]],
    ["landcruiser", "LandCruiser", "Full-size 4WD wagon and cab-chassis.", [
      ["lc300-gxl", "300 Series GXL", "Twin-turbo V6 diesel.", "2021–present"],
      ["lc300-sahara", "300 Series Sahara", "Luxury spec with JBL.", "2021–present"],
      ["lc79-gxl", "79 Series GXL", "Cab-chassis workhorse, single-DIN dash.", "2007–present"],
    ]],
    ["rav4", "RAV4", "Mid-size SUV, petrol and hybrid.", [
      ["rav4-gx", "GX", "Entry hybrid or petrol.", "2019–present"],
      ["rav4-cruiser", "Cruiser Hybrid", "Upper-spec AWD hybrid.", "2019–present"],
    ]],
    ["corolla", "Corolla", "Small hatch and sedan.", [["corolla-zr", "ZR Hybrid", "Top-spec hybrid hatch.", "2018–present"]]],
  ]),
  make("ford", "Ford", "USA", "Ranger and Everest lead the range in Australia.", "2026-06-09", [
    ["ranger", "Ranger", "Dual-cab ute, 4x2 and 4x4.", [
      ["ranger-xlt", "XLT", "10\" portrait SYNC 4 screen.", "2022–present"],
      ["ranger-wildtrak", "Wildtrak", "12\" SYNC 4, B&O audio option.", "2022–present"],
      ["ranger-raptor", "Raptor", "Twin-turbo V6 performance ute.", "2022–present"],
      ["ranger-px3-xlt", "PX III XLT", "Previous generation, SYNC 3.", "2018–2022"],
    ]],
    ["everest", "Everest", "Seven-seat 4WD wagon on the Ranger platform.", [
      ["everest-sport", "Sport", "Mid-spec V6 diesel.", "2022–present"],
      ["everest-platinum", "Platinum", "Flagship with B&O audio.", "2022–present"],
    ]],
  ]),
  make("mercedes", "Mercedes-Benz", "Germany", "Luxury sedans and SUVs with MBUX infotainment.", "2026-06-15", [
    ["merc-c-class", "C-Class", "Mid-size luxury sedan.", [
      ["merc-c200-w206", "C 200 (W206)", "1.5L turbo mild hybrid.", "2022–present"],
      ["merc-c300-w206", "C 300 (W206)", "2.0L turbo mild hybrid.", "2022–present"],
    ]],
    ["merc-glc", "GLC", "Mid-size luxury SUV.", [["merc-glc300-x254", "GLC 300 (X254)", "2.0L turbo, 4MATIC.", "2023–present"]]],
  ]),
  make("mazda", "Mazda", "Japan", "SUVs and the BT-50 ute.", "2026-07-01", [
    ["cx5", "CX-5", "Mid-size SUV.", [
      ["cx5-touring", "Touring", "Mid-spec, 10.25\" screen.", "2017–present"],
      ["cx5-gt-sp", "GT SP", "Turbo petrol with Bose audio.", "2022–present"],
    ]],
    ["bt50", "BT-50", "Dual-cab ute, shares the D-Max platform.", [["bt50-xtr", "XTR", "Upper-spec 4x4.", "2020–present"]]],
  ]),
  make("mitsubishi", "Mitsubishi", "Japan", "Triton ute and family SUVs.", "2026-07-20", [
    ["triton", "Triton", "Dual-cab ute.", [
      ["triton-glx", "GLX+", "Mid-spec work ute.", "2024–present"],
      ["triton-gsr", "GSR", "Sport-styled flagship.", "2024–present"],
    ]],
  ]),
  make("isuzu", "Isuzu", "Japan", "D-Max ute and MU-X wagon.", "2026-07-20", [
    ["dmax", "D-Max", "Dual-cab ute.", [
      ["dmax-ls-u", "LS-U", "Upper-spec with 9\" screen.", "2020–present"],
      ["dmax-x-terrain", "X-Terrain", "Flagship off-road styling.", "2020–present"],
    ]],
  ]),
];

export const PRODUCTS: AdminProduct[] = [
  { id: "p1", sku: "BD-X9-AND", name: 'BeatDeck X9 Android Stereo 9"', brand: "BeatDeck", departmentId: "d-stereo", price: 899, rrp: 1299, stock: 42, status: "active", fits: ["hilux", "ranger", "rav4", "corolla", "cx5", "triton", "dmax"], image: "/images/stereo-android.jpg", description: "9-inch HD head unit with wireless CarPlay, Android Auto and DAB+." },
  { id: "p9", sku: "BD-C7-DIN", name: 'BeatDeck C7 CarPlay Double-DIN 7"', brand: "BeatDeck", departmentId: "d-stereo", price: 449, rrp: 599, stock: 18, status: "active", fits: "universal", image: "/images/stereo-carplay.jpg", description: "7-inch double-DIN with wired CarPlay and Android Auto." },
  { id: "p13", sku: "BD-B12-BMW", name: 'BeatDeck B12 for BMW 12.3"', brand: "BeatDeck", departmentId: "d-stereo", price: 1199, rrp: 1599, stock: 4, status: "active", fits: ["bmw-3-series", "bmw-x5", "bmw-1-series"], image: "/images/hero-interior.jpg", description: "Factory-look 12.3-inch screen upgrade that keeps iDrive controls." },
  { id: "p2", sku: "PL-PRO-65C", name: 'Pulse Pro 6.5" Component Speakers', brand: "Pulse", departmentId: "d-audio", price: 329, rrp: 479, stock: 65, status: "active", fits: "universal", image: "/images/speaker-component.jpg", description: "Separate woofers and silk-dome tweeters, 100W RMS per pair." },
  { id: "p3", sku: "TH-12-USW", name: 'Thunder 12" Underseat Subwoofer', brand: "Thunder", departmentId: "d-audio", price: 699, rrp: 949, stock: 9, status: "active", fits: ["hilux", "ranger", "everest", "landcruiser", "bt50", "triton", "dmax"], image: "/images/subwoofer-underseat.jpg", description: "Slim powered sub that tucks under the rear seat of dual-cab utes." },
  { id: "p4", sku: "VA-4CH-1200", name: "VoltAmp 4-Channel Amplifier", brand: "VoltAmp", departmentId: "d-audio", price: 549, rrp: 749, stock: 23, status: "active", fits: "universal", image: "/images/amplifier.jpg", description: "4 x 150W RMS Class-D amp with high-level inputs." },
  { id: "p11", sku: "TH-10-TUBE", name: 'Thunder 10" Bass Tube', brand: "Thunder", departmentId: "d-audio", price: 399, rrp: 549, stock: 0, status: "active", fits: "universal", image: "/images/subwoofer-tube.jpg", description: "All-in-one powered bass tube with quick-release straps." },
  { id: "p14", sku: "PL-HK-BMW", name: "Pulse Harman Upgrade Kit for BMW", brand: "Pulse", departmentId: "d-audio", price: 799, rrp: 999, stock: 6, status: "draft", fits: ["bmw-3-series", "bmw-x5"], image: "/images/speaker-coaxial.jpg", description: "Plug-and-play speaker kit for BMW factory locations." },
  { id: "p5", sku: "RE-4K-DUO", name: "RoadEye 4K Dual Dash Cam", brand: "RoadEye", departmentId: "d-dashcam", price: 379, rrp: 499, stock: 31, status: "active", fits: "universal", image: "/images/dashcam.jpg", description: "4K front and 1080p rear with GPS and Wi-Fi app." },
  { id: "p12", sku: "LM-MTX-LED", name: "Lumen Matrix LED Headlights", brand: "Lumen", departmentId: "d-lighting", price: 299, rrp: 449, stock: 14, status: "active", fits: ["hilux", "ranger", "landcruiser", "rav4", "cx5", "triton"], image: "/images/headlights.jpg", description: "ADR-compliant LED upgrade with a sharp cut-off." },
  { id: "p6", sku: "LM-AMB-64", name: "Lumen Ambient Light Kit (64 colours)", brand: "Lumen", departmentId: "d-lighting", price: 149, rrp: 229, stock: 3, status: "active", fits: "universal", image: "/images/ambient-light.jpg", description: "Fibre-optic strips with app control and music sync." },
  { id: "p7", sku: "GR-MAG-15W", name: "GripCharge MagSafe 15W Mount", brand: "GripCharge", departmentId: "d-mounts", price: 89, rrp: 129, stock: 120, status: "active", fits: "universal", image: "/images/phone-mount.jpg", description: "Fast wireless charging mount with a built-in fan." },
  { id: "p8", sku: "FT-MAT-SET", name: "FitTrim Laser-Fit Floor Mats", brand: "FitTrim", departmentId: "d-interior", price: 189, rrp: 259, stock: 27, status: "active", fits: ["hilux", "ranger", "rav4", "cx5", "merc-c-class", "bmw-3-series"], image: "/images/floor-mats.jpg", description: "Laser-measured front and rear mats with raised edges." },
];

const addr = (address: string, suburb: string, state: string, postcode: string) => ({ address, suburb, state, postcode });

export const ORDERS: AdminOrder[] = [
  { id: "o-1048", number: "CB-1048", createdAt: "2026-10-03T08:42:00+10:00", status: "paid", customer: { name: "Liam Nguyen", email: "liam.nguyen@example.com", phone: "0412 345 678" }, shipTo: addr("14 Harbour St", "Pyrmont", "NSW", "2009"), delivery: "express", items: [{ productId: "p1", name: 'BeatDeck X9 Android Stereo 9"', unitPrice: 74900, qty: 1 }, { productId: "p2", name: 'Pulse Pro 6.5" Component Speakers', unitPrice: 32900, qty: 1 }], shipping: 1495, discount: 0 },
  { id: "o-1047", number: "CB-1047", createdAt: "2026-10-03T07:15:00+10:00", status: "pending_payment", customer: { name: "Charlotte Smith", email: "c.smith@example.com", phone: "0423 111 902" }, shipTo: addr("3/22 Ocean Pde", "Burleigh Heads", "QLD", "4220"), delivery: "standard", items: [{ productId: "p5", name: "RoadEye 4K Dual Dash Cam", unitPrice: 31900, qty: 1 }], shipping: 0, discount: 0 },
  { id: "o-1046", number: "CB-1046", createdAt: "2026-10-02T19:03:00+10:00", status: "fulfilled", customer: { name: "Jack Williams", email: "jackw@example.com", phone: "0401 228 340" }, shipTo: addr("88 Station Rd", "Box Hill", "VIC", "3128"), delivery: "standard", items: [{ productId: "p13", name: 'BeatDeck B12 for BMW 12.3"', unitPrice: 119900, qty: 1 }], shipping: 0, discount: 5000, coupon: "FIRSTBEAT" },
  { id: "o-1045", number: "CB-1045", createdAt: "2026-10-02T14:27:00+10:00", status: "paid", customer: { name: "Olivia Brown", email: "olivia.b@example.com", phone: "0433 765 210" }, shipTo: addr("5 Kingfisher Way", "Joondalup", "WA", "6027"), delivery: "standard", items: [{ productId: "p12", name: "Lumen Matrix LED Headlights", unitPrice: 29900, qty: 2 }, { productId: "p6", name: "Lumen Ambient Light Kit (64 colours)", unitPrice: 14900, qty: 1 }], shipping: 0, discount: 14900, coupon: "GLOWUP" },
  { id: "o-1044", number: "CB-1044", createdAt: "2026-10-02T09:50:00+10:00", status: "fulfilled", customer: { name: "Noah Taylor", email: "noah.t@example.com", phone: "0455 902 117" }, shipTo: addr("201 Gouger St", "Adelaide", "SA", "5000"), delivery: "collect", items: [{ productId: "p3", name: 'Thunder 12" Underseat Subwoofer', unitPrice: 69900, qty: 1 }, { productId: "p4", name: "VoltAmp 4-Channel Amplifier", unitPrice: 42900, qty: 1 }], shipping: 0, discount: 0 },
  { id: "o-1043", number: "CB-1043", createdAt: "2026-10-01T21:12:00+10:00", status: "cancelled", customer: { name: "Ava Martin", email: "ava.martin@example.com", phone: "0478 330 554" }, shipTo: addr("9 Elizabeth St", "Hobart", "TAS", "7000"), delivery: "standard", items: [{ productId: "p7", name: "GripCharge MagSafe 15W Mount", unitPrice: 8900, qty: 2 }], shipping: 995, discount: 0 },
  { id: "o-1042", number: "CB-1042", createdAt: "2026-10-01T16:40:00+10:00", status: "fulfilled", customer: { name: "William Lee", email: "will.lee@example.com", phone: "0419 004 381" }, shipTo: addr("47 Mort St", "Braddon", "ACT", "2612"), delivery: "express", items: [{ productId: "p1", name: 'BeatDeck X9 Android Stereo 9"', unitPrice: 74900, qty: 1 }, { productId: "p2", name: 'Pulse Pro 6.5" Component Speakers', unitPrice: 32900, qty: 1 }, { productId: "p3", name: 'Thunder 12" Underseat Subwoofer', unitPrice: 69900, qty: 1 }], shipping: 1495, discount: 53310, coupon: "BASSDROP" },
  { id: "o-1041", number: "CB-1041", createdAt: "2026-09-30T11:05:00+10:00", status: "fulfilled", customer: { name: "Mia Anderson", email: "mia.a@example.com", phone: "0402 551 772" }, shipTo: addr("12 Smith St", "Darwin", "NT", "0800"), delivery: "standard", items: [{ productId: "p8", name: "FitTrim Laser-Fit Floor Mats", unitPrice: 18900, qty: 1 }], shipping: 0, discount: 0 },
  { id: "o-1040", number: "CB-1040", createdAt: "2026-09-30T08:31:00+10:00", status: "paid", customer: { name: "Ethan Wilson", email: "ethan.w@example.com", phone: "0438 209 664" }, shipTo: addr("76 Brunswick St", "Fortitude Valley", "QLD", "4006"), delivery: "standard", items: [{ productId: "p9", name: 'BeatDeck C7 CarPlay Double-DIN 7"', unitPrice: 44900, qty: 1 }, { productId: "p7", name: "GripCharge MagSafe 15W Mount", unitPrice: 8900, qty: 1 }], shipping: 0, discount: 0 },
  { id: "o-1039", number: "CB-1039", createdAt: "2026-09-29T17:58:00+10:00", status: "fulfilled", customer: { name: "Isla Thompson", email: "isla.t@example.com", phone: "0466 318 920" }, shipTo: addr("230 Pitt St", "Sydney", "NSW", "2000"), delivery: "express", items: [{ productId: "p5", name: "RoadEye 4K Dual Dash Cam", unitPrice: 31900, qty: 2 }], shipping: 1495, discount: 0 },
  { id: "o-1038", number: "CB-1038", createdAt: "2026-09-29T10:22:00+10:00", status: "fulfilled", customer: { name: "Lucas White", email: "lucas.white@example.com", phone: "0421 840 335" }, shipTo: addr("18 Lygon St", "Carlton", "VIC", "3053"), delivery: "standard", items: [{ productId: "p11", name: 'Thunder 10" Bass Tube', unitPrice: 33900, qty: 1 }], shipping: 0, discount: 0 },
  { id: "o-1037", number: "CB-1037", createdAt: "2026-09-28T13:47:00+10:00", status: "fulfilled", customer: { name: "Grace Harris", email: "grace.h@example.com", phone: "0409 662 018" }, shipTo: addr("4 Marine Tce", "Fremantle", "WA", "6160"), delivery: "standard", items: [{ productId: "p12", name: "Lumen Matrix LED Headlights", unitPrice: 29900, qty: 1 }, { productId: "p8", name: "FitTrim Laser-Fit Floor Mats", unitPrice: 18900, qty: 1 }], shipping: 0, discount: 0 },
  { id: "o-1036", number: "CB-1036", createdAt: "2026-09-27T09:14:00+10:00", status: "fulfilled", customer: { name: "Henry Clark", email: "henry.c@example.com", phone: "0457 113 486" }, shipTo: addr("61 King William St", "Kent Town", "SA", "5067"), delivery: "collect", items: [{ productId: "p4", name: "VoltAmp 4-Channel Amplifier", unitPrice: 54900, qty: 1 }, { productId: "p2", name: 'Pulse Pro 6.5" Component Speakers', unitPrice: 32900, qty: 2 }], shipping: 0, discount: 0 },
  { id: "o-1035", number: "CB-1035", createdAt: "2026-09-26T15:36:00+10:00", status: "fulfilled", customer: { name: "Amelia Walker", email: "amelia.w@example.com", phone: "0414 775 209" }, shipTo: addr("102 James St", "Toowoomba", "QLD", "4350"), delivery: "standard", items: [{ productId: "p6", name: "Lumen Ambient Light Kit (64 colours)", unitPrice: 14900, qty: 3 }], shipping: 0, discount: 14900, coupon: "GLOWUP" },
];

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

export const COUPONS: Coupon[] = [
  { id: "c-bassdrop", code: "BASSDROP", description: "30% off car stereos and audio equipment", type: "percent", value: 30, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "departments", productIds: [], departmentIds: ["d-stereo", "d-audio"], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 214, startsAt: "2026-08-01", endsAt: "2026-12-31", active: true, createdAt: "2026-07-28T10:00:00+10:00" },
  { id: "c-firstbeat", code: "FIRSTBEAT", description: "$50 off your first order over $299", type: "fixed", value: 50, buyQty: 0, getQty: 0, minOrder: 299, maxDiscount: null, scope: "all", productIds: [], departmentIds: [], modelIds: [], firstOrderOnly: true, usageLimit: null, used: 588, startsAt: null, endsAt: null, active: true, createdAt: "2026-06-02T10:00:00+10:00" },
  { id: "c-glowup", code: "GLOWUP", description: "Buy 2 lighting items, get the 3rd free", type: "buy_x_get_y", value: 0, buyQty: 2, getQty: 1, minOrder: 0, maxDiscount: null, scope: "departments", productIds: [], departmentIds: ["d-lighting"], modelIds: [], firstOrderOnly: false, usageLimit: 500, used: 137, startsAt: "2026-09-15", endsAt: "2026-10-15", active: true, createdAt: "2026-09-10T10:00:00+10:00" },
  { id: "c-freeship", code: "FREESHIP", description: "Free express shipping, no minimum", type: "free_shipping", value: 0, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "all", productIds: [], departmentIds: [], modelIds: [], firstOrderOnly: false, usageLimit: 200, used: 200, startsAt: "2026-09-01", endsAt: null, active: true, createdAt: "2026-08-30T10:00:00+10:00" },
  { id: "c-eofy", code: "EOFY15", description: "15% off sitewide for end of financial year", type: "percent", value: 15, buyQty: 0, getQty: 0, minOrder: 100, maxDiscount: 150, scope: "all", productIds: [], departmentIds: [], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 941, startsAt: "2026-06-01", endsAt: "2026-06-30", active: true, createdAt: "2026-05-25T10:00:00+10:00" },
  { id: "c-summer", code: "SUMMERDASH", description: "$40 off dash cams for summer road trips", type: "fixed", value: 40, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "departments", productIds: [], departmentIds: ["d-dashcam"], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 0, startsAt: "2026-12-01", endsAt: "2027-01-31", active: true, createdAt: "2026-10-01T10:00:00+10:00" },
  { id: "c-uteowners", code: "UTEOWNERS20", description: "20% off anything that fits your ute, up to $250", type: "percent", value: 20, buyQty: 0, getQty: 0, minOrder: 200, maxDiscount: 250, scope: "models", productIds: [], departmentIds: [], modelIds: ["hilux", "ranger", "triton", "dmax", "bt50"], firstOrderOnly: false, usageLimit: 1000, used: 46, startsAt: "2026-09-20", endsAt: "2026-11-30", active: true, createdAt: "2026-09-18T10:00:00+10:00" },
  { id: "c-beatdeck", code: "BEATDECK100", description: "$100 off BeatDeck X9 and B12 head units", type: "fixed", value: 100, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "products", productIds: ["p1", "p13"], departmentIds: [], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 12, startsAt: null, endsAt: "2026-10-31", active: true, createdAt: "2026-09-25T10:00:00+10:00" },
];

export const OFFERS: Offer[] = [
  { id: "o1", title: "Ute & 4x4 Audio Upgrade", subtitle: "Stereo + speakers + sub bundle for HiLux, Ranger, Triton and more. Free fitting.", highlight: "30% OFF", image: "/images/hero-ranger.jpg", href: "/shop?category=stereo", couponId: "c-bassdrop", startsAt: "2026-08-01", endsAt: "2026-12-31", active: true, createdAt: "2026-07-28T10:00:00+10:00" },
  { id: "o2", title: "Road-trip ready", subtitle: "$50 off your first order over $299", highlight: "$50 OFF", image: "/images/coast-road.jpg", href: "/shop", couponId: "c-firstbeat", startsAt: null, endsAt: null, active: true, createdAt: "2026-06-02T10:00:00+10:00" },
  { id: "o3", title: "Lighting Week", subtitle: "All LED headlights and ambient kits", highlight: "Buy 2 Get 1", image: "/images/headlights-red.jpg", href: "/shop?category=lighting", couponId: "c-glowup", startsAt: "2026-09-15", endsAt: "2026-10-15", active: true, createdAt: "2026-09-10T10:00:00+10:00" },
  { id: "o4", title: "Summer Dash Cam Sale", subtitle: "Capture every kilometre of the holidays", highlight: "$40 OFF", image: "/images/dashcam.jpg", href: "/shop?category=dashcam", couponId: "c-summer", startsAt: "2026-12-01", endsAt: "2027-01-31", active: true, createdAt: "2026-10-01T10:00:00+10:00" },
];

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
