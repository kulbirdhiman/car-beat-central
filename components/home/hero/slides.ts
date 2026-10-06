import type { StaticImageData } from "next/image";
import interior from "@/public/images/hero-interior.jpg";
import ranger from "@/public/images/hero-ranger.jpg";
import subBuild from "@/public/images/hero-subwoofer-build.jpg";

/** Banner copy. Each one points at a department or a vehicle; its price line and link are worked out from the live catalogue. */
export type SlideSource = {
  image: StaticImageData;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  /** Department slug ("From $X" across its products) or vehicle model id ("Save up to X%" on parts that fit). */
  target: { dept: string } | { model: string; label: string };
};

/** A banner ready to show: its target exists and has products. */
export type Slide = Omit<SlideSource, "target"> & { price: string; cta: { label: string; href: string } };

export const SLIDE_SOURCES: SlideSource[] = [
  {
    image: interior,
    alt: "Modern car interior with a large touchscreen stereo",
    eyebrow: "Head unit upgrades",
    title: "Your factory dash, now a smart screen",
    body: "Wireless CarPlay, Android Auto and DAB+ with a fascia made for your model.",
    target: { dept: "car-stereos" },
  },
  {
    image: ranger,
    alt: "Orange Ford Ranger with bull bar and roof rack",
    eyebrow: "Ute & 4x4",
    title: "Built for corrugations and 40° days",
    body: "Dash cams, LED lighting and underseat subs for HiLux, Ranger, Triton and D-Max.",
    target: { model: "ranger", label: "Shop ute upgrades" },
  },
  {
    image: subBuild,
    alt: "Custom subwoofer build in a car boot lit in neon",
    eyebrow: "Speakers, subs & amps",
    title: "Feel every single note",
    body: "From slim underseat subs to full boot builds, fitted in every capital city.",
    target: { dept: "audio-equipment" },
  },
];

export const SLIDE_MS = 6500;
