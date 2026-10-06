import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

import type { Category, Product } from "@/lib/types";

const SHOTS: { src: string; title: string; category: Category; className: string }[] = [
  { src: "/images/hero-subwoofer-build.jpg", title: "Full boot build", category: "subwoofer", className: "lg:col-span-2 lg:row-span-2" },
  { src: "/images/ambient-light.jpg", title: "Ambient cabin lighting", category: "interior", className: "" },
  { src: "/images/stereo-carplay.jpg", title: "CarPlay head unit", category: "stereo", className: "" },
  { src: "/images/headlights-red.jpg", title: "LED headlight upgrade", category: "lighting", className: "" },
  { src: "/images/speaker-component.jpg", title: "Component door speakers", category: "speaker", className: "" },
];

/** The department most of a category's products sit in, so each photo is tagged and linked the way the store files them. */
function departmentFor(products: Product[], category: Category) {
  const tally = new Map<string, number>();
  for (const p of products) if (p.category === category && p.departmentName) tally.set(p.departmentName, (tally.get(p.departmentName) ?? 0) + 1);
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** Bento of finished-install photos, each linking to the live products it shows. Photos with nothing in stock to sell are left out. */
export function InstallGallery({ products }: { products: Product[] }) {
  const shots = SHOTS.flatMap((s) => {
    const tag = departmentFor(products, s.category);
    return tag ? [{ ...s, tag, href: `/shop?category=${s.category}` }] : [];
  });
  if (shots.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <SectionHeading eyebrow="Install inspiration" title="See what's possible" description="Ideas for your next upgrade, from a simple stereo swap to a full boot build." />
      <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] lg:grid-cols-4">
        {shots.map((s, i) => (
          <Reveal key={s.src} delay={i * 70} className={cn(i === 0 && "col-span-2 row-span-2", s.className)}>
            <Link href={s.href} className="group relative block size-full overflow-clip rounded-2xl bg-muted">
              <Image src={s.src} alt={s.title} fill sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">{s.tag}</p>
                <p className={cn("font-display font-bold leading-tight", i === 0 ? "text-2xl" : "text-base")}>{s.title}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
