import interior from "@/public/images/hero-interior.jpg";
import ranger from "@/public/images/hero-ranger.jpg";
import subBuild from "@/public/images/hero-subwoofer-build.jpg";

export const SLIDES = [
  {
    image: interior,
    alt: "Modern car interior with a large touchscreen stereo",
    eyebrow: "New season head units",
    title: ["Sound that", "fits your drive"],
    body: "Wireless CarPlay and Android Auto stereos, speakers and subs, matched to your exact make and model.",
    cta: { label: "Shop car stereos", href: "/shop?category=stereo" },
  },
  {
    image: ranger,
    alt: "Orange Ford Ranger with bull bar and roof rack",
    eyebrow: "Ute & 4x4 upgrades",
    title: ["Built for", "the big lap"],
    body: "Dash cams, LED lighting and audio that can handle corrugations, dust and 40° days.",
    cta: { label: "See this week's offers", href: "#offers" },
  },
  {
    image: subBuild,
    alt: "Custom subwoofer build in a car boot lit in neon",
    eyebrow: "Subwoofers & amps",
    title: ["Feel every", "single note"],
    body: "From underseat subs to full boot builds, fitted by certified installers in every capital city.",
    cta: { label: "Shop subwoofers", href: "/shop?category=subwoofer" },
  },
];

export const SLIDE_MS = 7000;
