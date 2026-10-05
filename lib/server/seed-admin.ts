import "server-only";
import type { AdminOrder, Coupon, Department, Offer, VehicleMake } from "../admin/model";

/** Starting data for the admin tables. Written to the database once, when it is first created. */

export const SEED_DEPARTMENTS: Department[] = [
  { id: "d-stereo", parentId: null, name: "Car Stereos", slug: "car-stereos", description: "Head units with Apple CarPlay, Android Auto and DAB+.", image: "/images/stereo-android.jpg", active: true, createdAt: "2026-06-02T09:00:00+10:00" },
  { id: "d-audio", parentId: null, name: "Audio Equipment", slug: "audio-equipment", description: "Speakers, subwoofers and amplifiers.", image: "/images/speaker-component.jpg", active: true, createdAt: "2026-06-02T09:00:00+10:00" },
  { id: "d-dashcam", parentId: null, name: "Dash Cams", slug: "dash-cams", description: "Front and rear cameras, hardwire kits and storage.", image: "/images/dashcam-mount.jpg", active: true, createdAt: "2026-06-09T09:00:00+10:00" },
  { id: "d-lighting", parentId: null, name: "LED Lighting", slug: "led-lighting", description: "Headlight upgrades and ambient interior lighting.", image: "/images/headlights-red.jpg", active: true, createdAt: "2026-06-15T09:00:00+10:00" },
  { id: "d-mounts", parentId: null, name: "Mounts & Charging", slug: "mounts-charging", description: "Phone mounts, wireless chargers and USB adapters.", image: "/images/phone-mount.jpg", active: true, createdAt: "2026-07-01T09:00:00+10:00" },
  { id: "d-interior", parentId: null, name: "Interior", slug: "interior", description: "Floor mats, seat covers and trim.", image: "/images/floor-mats.jpg", active: true, createdAt: "2026-07-20T09:00:00+10:00" },
  { id: "d-stereo-satnav", parentId: "d-stereo", name: "Satnav Car Stereos", slug: "satnav-car-stereos", description: "Head units with built-in GPS navigation and offline maps.", image: "/images/stereo-android.jpg", active: true, createdAt: "2026-06-03T09:00:00+10:00" },
  { id: "d-stereo-linux", parentId: "d-stereo", name: "Linux Car Stereos", slug: "linux-car-stereos", description: "Linux-based head units with wireless CarPlay and Android Auto.", image: "/images/stereo-android.jpg", active: true, createdAt: "2026-06-03T09:00:00+10:00" },
  { id: "d-cameras", parentId: null, name: "Reversing Cameras", slug: "reversing-cameras", description: "Rear-view and 360° parking cameras.", image: "/images/coast-road.jpg", active: false, createdAt: "2026-09-12T09:00:00+10:00" },
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

export const SEED_VEHICLE_MAKES: VehicleMake[] = [
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
    ["mazda3", "Mazda3", "Small hatch and sedan.", [["mazda3-g25-gt", "G25 GT", "2.5L petrol with Bose audio.", "2019–present"]]],
  ]),
  make("hyundai", "Hyundai", "South Korea", "i30 hatch and Tucson SUV.", "2026-07-20", [
    ["i30", "i30", "Small hatch, sedan and N performance.", [["i30-n-line", "N Line", "1.6L turbo hatch.", "2020–present"]]],
    ["tucson", "Tucson", "Mid-size SUV.", [["tucson-elite", "Elite", "Mid-spec with 10.25\" screen.", "2021–present"]]],
  ]),
  make("kia", "Kia", "South Korea", "Sportage and family SUVs.", "2026-07-20", [
    ["sportage", "Sportage", "Mid-size SUV.", [["sportage-gt-line", "GT-Line", "Flagship with Harman Kardon audio.", "2022–present"]]],
  ]),
  make("mitsubishi", "Mitsubishi", "Japan", "Triton ute and family SUVs.", "2026-07-20", [
    ["triton", "Triton", "Dual-cab ute.", [
      ["triton-glx", "GLX+", "Mid-spec work ute.", "2024–present"],
      ["triton-gsr", "GSR", "Sport-styled flagship.", "2024–present"],
    ]],
    ["outlander", "Outlander", "Seven-seat family SUV.", [["outlander-ls", "LS", "Mid-spec with 9\" screen.", "2022–present"]]],
  ]),
  make("isuzu", "Isuzu", "Japan", "D-Max ute and MU-X wagon.", "2026-07-20", [
    ["dmax", "D-Max", "Dual-cab ute.", [
      ["dmax-ls-u", "LS-U", "Upper-spec with 9\" screen.", "2020–present"],
      ["dmax-x-terrain", "X-Terrain", "Flagship off-road styling.", "2020–present"],
    ]],
  ]),
];

const addr = (address: string, suburb: string, state: string, postcode: string) => ({ address, suburb, state, postcode });

export const SEED_ORDERS: AdminOrder[] = [
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

export const SEED_COUPONS: Coupon[] = [
  { id: "c-bassdrop", code: "BASSDROP", description: "30% off car stereos and audio equipment", type: "percent", value: 30, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "departments", productIds: [], departmentIds: ["d-stereo", "d-audio"], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 214, startsAt: "2026-08-01", endsAt: "2026-12-31", active: true, createdAt: "2026-07-28T10:00:00+10:00" },
  { id: "c-firstbeat", code: "FIRSTBEAT", description: "$50 off your first order over $299", type: "fixed", value: 50, buyQty: 0, getQty: 0, minOrder: 299, maxDiscount: null, scope: "all", productIds: [], departmentIds: [], modelIds: [], firstOrderOnly: true, usageLimit: null, used: 588, startsAt: null, endsAt: null, active: true, createdAt: "2026-06-02T10:00:00+10:00" },
  { id: "c-glowup", code: "GLOWUP", description: "Buy 2 lighting items, get the 3rd free", type: "buy_x_get_y", value: 0, buyQty: 2, getQty: 1, minOrder: 0, maxDiscount: null, scope: "departments", productIds: [], departmentIds: ["d-lighting"], modelIds: [], firstOrderOnly: false, usageLimit: 500, used: 137, startsAt: "2026-09-15", endsAt: "2026-10-15", active: true, createdAt: "2026-09-10T10:00:00+10:00" },
  { id: "c-freeship", code: "FREESHIP", description: "Free express shipping, no minimum", type: "free_shipping", value: 0, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "all", productIds: [], departmentIds: [], modelIds: [], firstOrderOnly: false, usageLimit: 200, used: 200, startsAt: "2026-09-01", endsAt: null, active: true, createdAt: "2026-08-30T10:00:00+10:00" },
  { id: "c-eofy", code: "EOFY15", description: "15% off sitewide for end of financial year", type: "percent", value: 15, buyQty: 0, getQty: 0, minOrder: 100, maxDiscount: 150, scope: "all", productIds: [], departmentIds: [], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 941, startsAt: "2026-06-01", endsAt: "2026-06-30", active: true, createdAt: "2026-05-25T10:00:00+10:00" },
  { id: "c-summer", code: "SUMMERDASH", description: "$40 off dash cams for summer road trips", type: "fixed", value: 40, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "departments", productIds: [], departmentIds: ["d-dashcam"], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 0, startsAt: "2026-12-01", endsAt: "2027-01-31", active: true, createdAt: "2026-10-01T10:00:00+10:00" },
  { id: "c-uteowners", code: "UTEOWNERS20", description: "20% off anything that fits your ute, up to $250", type: "percent", value: 20, buyQty: 0, getQty: 0, minOrder: 200, maxDiscount: 250, scope: "models", productIds: [], departmentIds: [], modelIds: ["hilux", "ranger", "triton", "dmax", "bt50"], firstOrderOnly: false, usageLimit: 1000, used: 46, startsAt: "2026-09-20", endsAt: "2026-11-30", active: true, createdAt: "2026-09-18T10:00:00+10:00" },
  { id: "c-beatdeck", code: "BEATDECK100", description: "$100 off BeatDeck X9 and B12 head units", type: "fixed", value: 100, buyQty: 0, getQty: 0, minOrder: 0, maxDiscount: null, scope: "products", productIds: ["p1", "p13"], departmentIds: [], modelIds: [], firstOrderOnly: false, usageLimit: null, used: 12, startsAt: null, endsAt: "2026-10-31", active: true, createdAt: "2026-09-25T10:00:00+10:00" },
];

export const SEED_OFFERS: Offer[] = [
  { id: "o1", title: "Ute & 4x4 Audio Upgrade", subtitle: "Stereo + speakers + sub bundle for HiLux, Ranger, Triton and more. Free fitting.", highlight: "30% OFF", image: "/images/hero-ranger.jpg", href: "/shop?category=stereo", couponId: "c-bassdrop", startsAt: "2026-08-01", endsAt: "2026-12-31", active: true, createdAt: "2026-07-28T10:00:00+10:00" },
  { id: "o2", title: "Road-trip ready", subtitle: "$50 off your first order over $299", highlight: "$50 OFF", image: "/images/coast-road.jpg", href: "/shop", couponId: "c-firstbeat", startsAt: null, endsAt: null, active: true, createdAt: "2026-06-02T10:00:00+10:00" },
  { id: "o3", title: "Lighting Week", subtitle: "All LED headlights and ambient kits", highlight: "Buy 2 Get 1", image: "/images/headlights-red.jpg", href: "/shop?category=lighting", couponId: "c-glowup", startsAt: "2026-09-15", endsAt: "2026-10-15", active: true, createdAt: "2026-09-10T10:00:00+10:00" },
  { id: "o4", title: "Summer Dash Cam Sale", subtitle: "Capture every kilometre of the holidays", highlight: "$40 OFF", image: "/images/dashcam.jpg", href: "/shop?category=dashcam", couponId: "c-summer", startsAt: "2026-12-01", endsAt: "2027-01-31", active: true, createdAt: "2026-10-01T10:00:00+10:00" },
];
