import interior from "@/public/images/hero-interior.jpg";
import ranger from "@/public/images/hero-ranger.jpg";
import subBuild from "@/public/images/hero-subwoofer-build.jpg";

export const SLIDES = [
  {
    image: interior,
    alt: "Modern car interior with a large touchscreen stereo",
    eyebrow: "Head unit upgrades",
    title: "Your factory dash, now a 9″ smart screen",
    body: "Wireless CarPlay, Android Auto and DAB+ with a fascia made for your model.",
    price: "From $549",
    cta: { label: "Shop car stereos", href: "/shop?category=stereo" },
  },
  {
    image: ranger,
    alt: "Orange Ford Ranger with bull bar and roof rack",
    eyebrow: "Ute & 4x4",
    title: "Built for corrugations and 40° days",
    body: "Dash cams, LED lighting and underseat subs for HiLux, Ranger, Triton and D-Max.",
    price: "Save up to 30%",
    cta: { label: "Shop ute upgrades", href: "/shop?model=ranger" },
  },
  {
    image: subBuild,
    alt: "Custom subwoofer build in a car boot lit in neon",
    eyebrow: "Subwoofers & amps",
    title: "Feel every single note",
    body: "From slim underseat subs to full boot builds, fitted in every capital city.",
    price: "From $429",
    cta: { label: "Shop subwoofers", href: "/shop?category=subwoofer" },
  },
];

export const SLIDE_MS = 6500;
