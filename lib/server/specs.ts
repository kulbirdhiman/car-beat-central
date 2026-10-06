import "server-only";
import { CATEGORY_LABELS } from "../data";
import type { Product } from "../types";

type Spec = [label: string, value: string];

/** Product-specific specification rows, taken from each product's description and features. */
const SPECS: Record<string, Spec[]> = {
  p1: [
    ["Screen", '9" HD touchscreen'],
    ["Smartphone", "Wireless Apple CarPlay & Android Auto"],
    ["Radio", "DAB+ digital radio"],
    ["Equaliser", "32-band EQ"],
    ["Camera input", "Reversing camera"],
    ["Controls", "Keeps steering-wheel controls"],
    ["In the box", "Vehicle-specific fascia and wiring harness"],
  ],
  p2: [
    ["Type", '6.5" component (separate woofer + tweeter)'],
    ["Power", "100W RMS per pair"],
    ["Tweeter", "Silk dome"],
    ["Crossover", "Passive crossovers included"],
    ["Mounting", "Fits most front doors"],
  ],
  p3: [
    ["Driver size", '12"'],
    ["Amplifier", "Built-in 300W"],
    ["Mounting", "Under rear seat"],
    ["Enclosure", "Custom-fit"],
    ["Controls", "Remote bass knob"],
    ["Designed for", "Dual-cab utes and 4WDs"],
  ],
  p4: [
    ["Channels", "4 (bridgeable to 2)"],
    ["Power", "4 x 150W RMS"],
    ["Total power", "1200W"],
    ["Class", "Class-D"],
    ["Inputs", "High-level inputs for factory stereos"],
  ],
  p5: [
    ["Front camera", "4K"],
    ["Rear camera", "1080p"],
    ["GPS", "Speed & location"],
    ["Connectivity", "Wi-Fi app"],
    ["Power backup", "Supercapacitor (no battery)"],
    ["Heat rating", "Up to 70°C"],
    ["Parking mode", "Yes, with hardwire kit"],
  ],
  p6: [
    ["Type", "Fibre-optic ambient strips"],
    ["Colours", "64"],
    ["Control", "Phone app, music sync"],
    ["Power", "USB-C, plug-and-play"],
    ["Length", "6 metres"],
  ],
  p7: [
    ["Charging", "15W fast wireless"],
    ["Compatibility", "MagSafe compatible"],
    ["Mounting", "Vent and dash mounts included"],
    ["Cooling", "Built-in fan"],
  ],
  p8: [
    ["Fit", "Laser-measured for your model"],
    ["Edges", "Raised, waterproof"],
    ["Backing", "Anti-slip"],
    ["In the box", "Front and rear set"],
  ],
  p9: [
    ["Screen", '7" touchscreen'],
    ["Size", "Double-DIN"],
    ["Smartphone", "Wired Apple CarPlay & Android Auto"],
    ["Bluetooth", "Hands-free calling"],
    ["Camera input", "Reversing camera"],
  ],
  p10: [
    ["Size", '6x9"'],
    ["Design", "3-way coaxial"],
    ["Power", "90W RMS per pair"],
    ["Cones", "Carbon fibre"],
    ["In the box", "Grilles included"],
  ],
  p11: [
    ["Driver size", '10"'],
    ["Type", "Powered bass tube"],
    ["Amplifier", "Built-in 250W"],
    ["Inputs", "High and low-level"],
    ["Mounting", "Quick-release straps"],
    ["In the box", "Wiring kit"],
  ],
  p12: [
    ["Light source", "LED matrix"],
    ["Colour temperature", "6500K daylight white"],
    ["Compliance", "ADR compliant"],
    ["Waterproofing", "IP68"],
    ["Install", "Plug-and-play harness"],
  ],
};

/** The product's own specification rows, without the common ones. */
export function getProductSpecs(product: Pick<Product, "id">): Spec[] {
  return SPECS[product.id] ?? [];
}

/** Common rows first, then the product's own. */
export function getSpecs(product: Product): Spec[] {
  return [
    ["Brand", product.brand],
    ["Category", product.departmentName ?? CATEGORY_LABELS[product.category]],
    ...(SPECS[product.id] ?? []),
    ["Fitment", product.fits === "universal" ? "Universal" : `${product.fits.length} vehicle models`],
    ["Warranty", "12 months"],
  ];
}
